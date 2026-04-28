from __future__ import annotations

import csv
import hashlib
import hmac
import io
import secrets
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated, Any

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field


DB_PATH = Path(__file__).with_name("financeai.db")
TEMPLATES = [
    {"title": "Monthly Summary", "subtitle": "Performance and holdings"},
    {"title": "Tax Report", "subtitle": "Capital gains and losses"},
    {"title": "Quarterly Review", "subtitle": "Comprehensive analysis"},
    {"title": "Transaction Export", "subtitle": "All trades and activity"},
]
SCHEDULED_REPORT = {
    "title": "Monthly Performance",
    "subtitle": "Every 1st of the month",
    "status": "Active",
}
UPLOAD_COLUMNS = [
    "Date (YYYY-MM-DD)",
    "Type (Buy/Sell)",
    "Symbol (Stock Ticker)",
    "Quantity (Number of shares)",
    "Price (Price per share)",
]
SUPPORTED_BROKERAGES = [
    "Robinhood",
    "E*TRADE",
    "TD Ameritrade",
    "Fidelity",
    "Charles Schwab",
    "Interactive Brokers",
]
PRICE_BOOK: dict[str, dict[str, Any]] = {
    "AAPL": {"company": "Apple Inc.", "price": 198.30, "sector": "Technology", "risk": "Medium Risk"},
    "MSFT": {"company": "Microsoft Corporation", "price": 421.10, "sector": "Technology", "risk": "Low Risk"},
    "NVDA": {"company": "NVIDIA Corporation", "price": 972.40, "sector": "Technology", "risk": "Medium Risk"},
    "AMD": {"company": "Advanced Micro Devices", "price": 176.40, "sector": "Technology", "risk": "Medium Risk"},
    "GOOGL": {"company": "Alphabet Inc.", "price": 164.20, "sector": "Technology", "risk": "Medium Risk"},
    "JNJ": {"company": "Johnson & Johnson", "price": 163.10, "sector": "Healthcare", "risk": "Low Risk"},
    "JPM": {"company": "JPMorgan Chase & Co.", "price": 201.20, "sector": "Finance", "risk": "Low Risk"},
    "XOM": {"company": "Exxon Mobil Corporation", "price": 121.60, "sector": "Energy", "risk": "Medium Risk"},
    "KO": {"company": "The Coca-Cola Company", "price": 63.20, "sector": "Consumer", "risk": "Low Risk"},
    "BND": {"company": "Vanguard Total Bond Market ETF", "price": 72.80, "sector": "Bonds", "risk": "Low Risk"},
    "VOO": {"company": "Vanguard S&P 500 ETF", "price": 512.70, "sector": "ETFs", "risk": "Low Risk"},
}
DEFAULT_TRANSACTIONS: list[dict[str, Any]] = [
    {"date": "2026-01-10", "type": "Buy", "symbol": "AAPL", "quantity": 20.0, "price": 188.50},
    {"date": "2026-01-12", "type": "Buy", "symbol": "MSFT", "quantity": 10.0, "price": 405.25},
    {"date": "2026-01-18", "type": "Buy", "symbol": "NVDA", "quantity": 8.0, "price": 910.00},
    {"date": "2026-02-02", "type": "Buy", "symbol": "JNJ", "quantity": 12.0, "price": 158.10},
    {"date": "2026-02-11", "type": "Buy", "symbol": "BND", "quantity": 50.0, "price": 71.25},
    {"date": "2026-03-04", "type": "Buy", "symbol": "VOO", "quantity": 15.0, "price": 501.40},
    {"date": "2026-03-11", "type": "Buy", "symbol": "JPM", "quantity": 14.0, "price": 194.10},
    {"date": "2026-03-18", "type": "Sell", "symbol": "AAPL", "quantity": 4.0, "price": 196.20},
]


app = FastAPI(
    title="FinanceAI API",
    version="2.0.0",
    description="SQLite-backed MVP backend for the FinanceAI frontend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)
    goal: str = "Long-term growth"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(min_length=2)
    email: EmailStr
    risk_preference: str
    primary_goal: str
    base_currency: str
    reports: str


class ReportGenerateRequest(BaseModel):
    format: str
    date_range: str
    sections: list[str]


class EmailReportRequest(BaseModel):
    email: EmailStr
    report_name: str


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


def get_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def parse_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d")


def month_label(value: datetime) -> str:
    return value.strftime("%b")


def currency(amount: float) -> str:
    return f"${amount:,.2f}"


def percent(value: float) -> str:
    prefix = "+" if value > 0 else ""
    return f"{prefix}{value:.1f}%"


def hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return digest.hex()


def make_password_fields(password: str) -> tuple[str, str]:
    salt = secrets.token_hex(16)
    return salt, hash_password(password, salt)


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password, salt), expected_hash)


def create_session(connection: sqlite3.Connection, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    connection.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
    connection.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, utc_now_iso()),
    )
    connection.commit()
    return token


def resolve_asset(symbol: str) -> dict[str, Any]:
    asset = PRICE_BOOK.get(symbol.upper())
    if asset:
        return asset
    return {
        "company": f"{symbol.upper()} Holdings",
        "price": 100.0,
        "sector": "Other",
        "risk": "Medium Risk",
    }


def public_user_profile(user: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "plan": user["plan"],
        "member_since": user["member_since"],
        "risk_preference": user["risk_preference"],
        "primary_goal": user["primary_goal"],
        "base_currency": user["base_currency"],
        "reports": user["reports"],
    }


def current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")

    token = authorization.removeprefix("Bearer ").strip()
    with get_db() as connection:
        user = connection.execute(
            """
            SELECT users.*
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    return {"token": token, "user": user}


def fetch_transactions(connection: sqlite3.Connection, user_id: int) -> list[sqlite3.Row]:
    return connection.execute(
        """
        SELECT date, type, symbol, quantity, price
        FROM transactions
        WHERE user_id = ?
        ORDER BY date ASC, id ASC
        """,
        (user_id,),
    ).fetchall()


def build_positions(connection: sqlite3.Connection, user_id: int) -> dict[str, dict[str, Any]]:
    positions: dict[str, dict[str, Any]] = {}
    for transaction in fetch_transactions(connection, user_id):
        symbol = transaction["symbol"].upper()
        asset = resolve_asset(symbol)
        position = positions.setdefault(
            symbol,
            {
                "symbol": symbol,
                "quantity": 0.0,
                "cost_basis": 0.0,
                "buys": 0.0,
                "sells": 0.0,
                "company": asset["company"],
                "sector": asset["sector"],
                "risk": asset["risk"],
            },
        )

        quantity = float(transaction["quantity"])
        trade_value = quantity * float(transaction["price"])
        if transaction["type"].lower() == "buy":
            position["quantity"] += quantity
            position["cost_basis"] += trade_value
            position["buys"] += trade_value
        else:
            average_cost = (
                position["cost_basis"] / position["quantity"] if position["quantity"] > 0 else 0.0
            )
            position["quantity"] = max(position["quantity"] - quantity, 0.0)
            position["cost_basis"] = max(position["cost_basis"] - average_cost * quantity, 0.0)
            position["sells"] += trade_value

    return {symbol: item for symbol, item in positions.items() if item["quantity"] > 0}


def position_snapshot(connection: sqlite3.Connection, user: sqlite3.Row) -> list[dict[str, Any]]:
    holdings = []
    for symbol, position in build_positions(connection, user["id"]).items():
        live = resolve_asset(symbol)
        market_value = position["quantity"] * float(live["price"])
        average_cost = position["cost_basis"] / position["quantity"]
        gain_loss = market_value - position["cost_basis"]
        holdings.append(
            {
                **position,
                "company": live["company"],
                "sector": live["sector"],
                "current_price": float(live["price"]),
                "market_value": market_value,
                "average_cost": average_cost,
                "gain_loss": gain_loss,
            }
        )
    return sorted(holdings, key=lambda item: item["market_value"], reverse=True)


def total_portfolio_value(holdings: list[dict[str, Any]], user: sqlite3.Row) -> float:
    return sum(item["market_value"] for item in holdings) + float(user["cash_balance"])


def allocation_breakdown(holdings: list[dict[str, Any]], user: sqlite3.Row) -> list[dict[str, Any]]:
    total_value = total_portfolio_value(holdings, user)
    buckets = {"Stocks": 0.0, "Bonds": 0.0, "ETFs": 0.0, "Cash": float(user["cash_balance"])}
    for holding in holdings:
        if holding["sector"] == "Bonds":
            buckets["Bonds"] += holding["market_value"]
        elif holding["sector"] == "ETFs":
            buckets["ETFs"] += holding["market_value"]
        else:
            buckets["Stocks"] += holding["market_value"]

    colors = {"Stocks": "#2563eb", "Bonds": "#10b981", "ETFs": "#f59e0b", "Cash": "#64748b"}
    return [
        {
            "label": label,
            "value": round((amount / total_value) * 100) if total_value else 0,
            "color": colors[label],
        }
        for label, amount in buckets.items()
    ]


def performance_series(connection: sqlite3.Connection, user_id: int) -> list[dict[str, Any]]:
    transactions = fetch_transactions(connection, user_id)
    monthly_buys: dict[str, float] = {}
    monthly_sells: dict[str, float] = {}
    for transaction in transactions:
        month = month_label(parse_date(transaction["date"]))
        bucket = monthly_buys if transaction["type"].lower() == "buy" else monthly_sells
        bucket[month] = bucket.get(month, 0.0) + float(transaction["quantity"]) * float(transaction["price"])

    months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    running = 42.0
    series = []
    for index, month in enumerate(months):
        running += monthly_buys.get(month, 0.0) / 1000
        running -= monthly_sells.get(month, 0.0) / 1400
        running += 1.5 + (index % 3) * 0.9
        series.append({"month": month, "value": round(running, 1)})
    return series


def dashboard_payload(connection: sqlite3.Connection, user: sqlite3.Row) -> dict[str, Any]:
    holdings = position_snapshot(connection, user)
    invested_value = sum(item["market_value"] for item in holdings)
    cost_basis = sum(item["cost_basis"] for item in holdings)
    total_value = total_portfolio_value(holdings, user)
    total_gain = invested_value - cost_basis
    day_gain = invested_value * 0.0068
    best_performer = holdings[0]["symbol"] if holdings else "Cash"
    cash_share = (float(user["cash_balance"]) / total_value * 100) if total_value else 0.0
    growth_pct = (total_gain / cost_basis * 100) if cost_basis else 0.0

    return {
        "summary_cards": [
            {
                "title": "Total Portfolio Value",
                "value": currency(total_value),
                "change": percent(growth_pct),
                "detail": f"Across {len(holdings)} active holdings",
                "tone": "#0f9f6e" if total_gain >= 0 else "#dc2626",
            },
            {
                "title": "Total Gain/Loss",
                "value": currency(total_gain),
                "change": percent(growth_pct),
                "detail": f"Best performer: {best_performer}",
                "tone": "#0f9f6e" if total_gain >= 0 else "#dc2626",
            },
            {
                "title": "Day's Gain/Loss",
                "value": currency(day_gain),
                "change": "+0.7%",
                "detail": "Based on latest marked prices",
                "tone": "#2563eb",
            },
            {
                "title": "Cash Available",
                "value": currency(float(user["cash_balance"])),
                "change": f"{cash_share:.0f}%",
                "detail": "Ready for reallocation",
                "tone": "#b45309",
            },
        ],
        "performance": performance_series(connection, user["id"]),
        "allocation": allocation_breakdown(holdings, user),
    }


def sector_exposure(holdings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    invested = sum(item["market_value"] for item in holdings)
    totals: dict[str, float] = {}
    for holding in holdings:
        totals[holding["sector"]] = totals.get(holding["sector"], 0.0) + holding["market_value"]

    sectors = [
        {"label": label, "value": round(amount / invested * 100) if invested else 0}
        for label, amount in sorted(totals.items(), key=lambda item: item[1], reverse=True)
    ]
    if len(sectors) < 6:
        sectors.append({"label": "Other", "value": max(0, 100 - sum(item["value"] for item in sectors))})
    return sectors[:6]


def risk_payload(connection: sqlite3.Connection, user: sqlite3.Row) -> dict[str, Any]:
    holdings = position_snapshot(connection, user)
    total_value = total_portfolio_value(holdings, user)
    invested = sum(item["market_value"] for item in holdings)
    allocation = allocation_breakdown(holdings, user)
    sectors = sector_exposure(holdings)
    largest_position = max((item["market_value"] for item in holdings), default=0.0)
    largest_sector = max((item["value"] for item in sectors), default=0)
    cash_share = next((item["value"] for item in allocation if item["label"] == "Cash"), 0)

    diversification = max(35, 100 - int(largest_position / total_value * 100)) if total_value else 50
    sector_concentration = max(20, min(95, largest_sector + 25))
    volatility = min(95, 30 + len([item for item in holdings if item["risk"] != "Low Risk"]) * 8)
    market_exposure = min(95, max(25, int(invested / total_value * 100) + 5)) if total_value else 40
    liquidity = min(95, max(25, cash_share + 35))
    currency_risk = 45 if user["base_currency"] == "USD" else 60
    overall = round(
        (
            volatility
            + (100 - diversification)
            + sector_concentration
            + market_exposure
            + (100 - liquidity)
            + currency_risk
        )
        / 6
    )

    label = "Low Risk" if overall < 45 else "Medium Risk" if overall < 70 else "High Risk"
    benchmark = max(40, overall - 8)
    trend = [
        {
            "month": month,
            "portfolio": max(25, min(90, overall - 8 + index * 2)),
            "benchmark": max(25, min(85, benchmark - 5 + index * 2)),
        }
        for index, month in enumerate(["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"])
    ]

    alerts = []
    if largest_sector >= 35:
        alerts.append(
            {
                "title": "High Concentration Alert",
                "message": f"Your largest sector represents {largest_sector}% of invested assets. Consider diversifying.",
                "tone": "warning",
            }
        )
    if cash_share < 8:
        alerts.append(
            {
                "title": "Low Cash Buffer",
                "message": "Available cash is thin for new opportunities or market pullbacks.",
                "tone": "info",
            }
        )
    if not alerts:
        alerts.append(
            {
                "title": "Risk Profile Stable",
                "message": "Your allocation is within a manageable range for the selected investor profile.",
                "tone": "info",
            }
        )

    recommendations = []
    if largest_sector >= 35:
        recommendations.append(
            {
                "title": "Reduce Top Sector Exposure",
                "description": "Trim the most concentrated sector and rebalance toward underweighted areas.",
                "color": "#2563eb",
                "bg": "#dbeafe",
                "icon": "shield",
            }
        )
    if cash_share < 12:
        recommendations.append(
            {
                "title": "Rebuild Cash Reserve",
                "description": "Target a 10-15% cash allocation so you can absorb volatility and deploy capital selectively.",
                "color": "#16a34a",
                "bg": "#dcfce7",
                "icon": "trendDown",
            }
        )
    recommendations.append(
        {
            "title": "Use Watchlist for Staged Entries",
            "description": "Phase into new ideas over several trades instead of adding all exposure at once.",
            "color": "#9333ea",
            "bg": "#f3e8ff",
            "icon": "line",
        }
    )

    return {
        "score": {
            "overall": overall,
            "industry_average": 55,
            "recommended_range": "45-60",
            "label": label,
        },
        "radar": [
            {"label": "Volatility", "value": volatility},
            {"label": "Diversification", "value": diversification},
            {"label": "Sector Concentration", "value": sector_concentration},
            {"label": "Market Exposure", "value": market_exposure},
            {"label": "Liquidity", "value": liquidity},
            {"label": "Currency Risk", "value": currency_risk},
        ],
        "trend": trend,
        "sectors": sectors,
        "detail_metrics": [
            {"label": "Volatility", "value": volatility},
            {"label": "Diversification", "value": diversification},
            {"label": "Sector Concentration", "value": sector_concentration},
            {"label": "Market Exposure", "value": market_exposure},
            {"label": "Liquidity", "value": liquidity},
        ],
        "alerts": alerts,
        "recommendations": recommendations,
    }


def fetch_watchlist(connection: sqlite3.Connection, user_id: int) -> list[str]:
    rows = connection.execute(
        "SELECT symbol FROM watchlist WHERE user_id = ? ORDER BY created_at DESC, id DESC",
        (user_id,),
    ).fetchall()
    return [row["symbol"] for row in rows]


def recommendation_description(sector: str, goal: str, is_watchlist: bool) -> str:
    if "growth" in goal.lower() and sector == "Technology":
        base = "Fits a growth-oriented portfolio with strong upside and durable product demand."
    elif "income" in goal.lower():
        base = "Supports a steadier income profile with more defensive return characteristics."
    else:
        base = "Improves diversification while keeping the portfolio aligned with your target profile."
    if is_watchlist:
        return f"{base} Already on your watchlist, making it a natural next candidate to monitor."
    return base


def recommendations_payload(connection: sqlite3.Connection, user: sqlite3.Row) -> dict[str, Any]:
    holdings = position_snapshot(connection, user)
    owned_symbols = {item["symbol"] for item in holdings}
    sectors_owned = {item["sector"] for item in holdings}
    watchlist = set(fetch_watchlist(connection, user["id"]))
    ideas = []
    risk_profile = user["risk_preference"].lower()
    goal = user["primary_goal"].lower()

    for ticker, asset in PRICE_BOOK.items():
        price = float(asset["price"])
        score = 68
        if ticker in watchlist:
            score += 8
        if ticker not in owned_symbols:
            score += 10
        if asset["sector"] not in sectors_owned:
            score += 7
        if "growth" in goal and asset["sector"] == "Technology":
            score += 8
        if "income" in goal and asset["sector"] in {"Bonds", "Consumer", "Healthcare"}:
            score += 8
        if risk_profile == "conservative" and asset["risk"] == "Low Risk":
            score += 7
        if risk_profile == "aggressive" and asset["risk"] != "Low Risk":
            score += 6

        upside_pct = round(min(18.0, max(4.5, score / 7)), 1)
        action = "Strong Buy" if score >= 88 else "Buy" if score >= 78 else "Watch"
        confidence = "Very High" if score >= 90 else "High" if score >= 82 else "Moderate"
        change = round(((score % 7) - 2) * 0.7, 1)
        ideas.append(
            {
                "ticker": ticker,
                "company": asset["company"],
                "price": currency(price),
                "change": f"{abs(change):.1f}%",
                "change_color": "#16a34a" if change >= 0 else "#dc2626",
                "action": action,
                "risk": asset["risk"],
                "ai_score": min(score, 96),
                "description": recommendation_description(asset["sector"], user["primary_goal"], ticker in watchlist),
                "target_price": currency(price * (1 + upside_pct / 100)),
                "upside": f"+{upside_pct:.1f}%",
                "confidence_label": confidence,
            }
        )

    ideas.sort(key=lambda item: item["ai_score"], reverse=True)
    diversification_fit = min(95, 55 + len(PRICE_BOOK) - len(sectors_owned) * 3)
    return {
        "summary": {
            "opportunities_found": len(PRICE_BOOK),
            "message": f"{len(watchlist)} tickers are already on your watchlist.",
        },
        "filters": ["AI Picks", "Trending", "High Dividend"],
        "stocks": ideas[:3],
        "fit_analysis": [
            {"label": "Risk Alignment", "value": 82 if user["risk_preference"] != "Conservative" else 90},
            {"label": "Sector Diversification", "value": max(55, min(92, diversification_fit))},
            {"label": "Growth Potential", "value": 88 if "growth" in goal else 72},
            {"label": "Dividend Yield", "value": 70 if "income" in goal else 48},
            {"label": "Valuation", "value": 68},
        ],
    }


def reports_payload(connection: sqlite3.Connection, user_id: int) -> dict[str, Any]:
    recent_rows = connection.execute(
        """
        SELECT title, meta
        FROM reports
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 8
        """,
        (user_id,),
    ).fetchall()
    return {
        "templates": TEMPLATES,
        "recent": [dict(row) for row in recent_rows],
        "scheduled": SCHEDULED_REPORT,
    }


def uploads_payload(connection: sqlite3.Connection, user_id: int) -> dict[str, Any]:
    recent_rows = connection.execute(
        """
        SELECT name, date_label AS date, status
        FROM uploads
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 8
        """,
        (user_id,),
    ).fetchall()
    return {
        "required_columns": UPLOAD_COLUMNS,
        "supported_brokerages": SUPPORTED_BROKERAGES,
        "recent_uploads": [dict(row) for row in recent_rows],
    }


def coerce_transaction(row: dict[str, str]) -> dict[str, Any]:
    normalized = {key.strip().lower(): value.strip() for key, value in row.items() if key and value}
    if not normalized:
        raise ValueError("Encountered an empty row.")
    try:
        date_value = normalized["date"]
        parse_date(date_value)
        tx_type = normalized["type"].capitalize()
        symbol = normalized["symbol"].upper()
        quantity = float(normalized["quantity"])
        price = float(normalized["price"])
    except KeyError as exc:
        raise ValueError(f"Missing required column: {exc.args[0]}") from exc
    except ValueError as exc:
        raise ValueError(str(exc)) from exc

    if tx_type not in {"Buy", "Sell"}:
        raise ValueError("Type must be Buy or Sell.")
    if quantity <= 0 or price <= 0:
        raise ValueError("Quantity and price must be positive values.")

    return {
        "date": date_value,
        "type": tx_type,
        "symbol": symbol,
        "quantity": quantity,
        "price": price,
    }


def validate_incoming_transactions(
    connection: sqlite3.Connection,
    user: sqlite3.Row,
    parsed_rows: list[dict[str, Any]],
) -> None:
    running_cash = float(user["cash_balance"])
    running_positions = {
        symbol: values["quantity"] for symbol, values in build_positions(connection, user["id"]).items()
    }

    for transaction in sorted(parsed_rows, key=lambda item: item["date"]):
        symbol = transaction["symbol"]
        quantity = float(transaction["quantity"])
        trade_value = quantity * float(transaction["price"])
        if transaction["type"] == "Buy":
            if trade_value > running_cash:
                raise ValueError(f"Insufficient cash balance for buying {symbol}.")
            running_cash -= trade_value
            running_positions[symbol] = running_positions.get(symbol, 0.0) + quantity
        else:
            if quantity > running_positions.get(symbol, 0.0):
                raise ValueError(f"Cannot sell {quantity} shares of {symbol}; holdings are too low.")
            running_positions[symbol] -= quantity
            running_cash += trade_value


def insert_transactions(
    connection: sqlite3.Connection,
    user: sqlite3.Row,
    parsed_rows: list[dict[str, Any]],
    filename: str,
) -> dict[str, Any]:
    validate_incoming_transactions(connection, user, parsed_rows)

    cash_balance = float(user["cash_balance"])
    for transaction in parsed_rows:
        trade_value = float(transaction["quantity"]) * float(transaction["price"])
        if transaction["type"] == "Buy":
            cash_balance -= trade_value
        else:
            cash_balance += trade_value

        connection.execute(
            """
            INSERT INTO transactions (user_id, date, type, symbol, quantity, price, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                transaction["date"],
                transaction["type"],
                transaction["symbol"],
                transaction["quantity"],
                transaction["price"],
                filename,
            ),
        )

    connection.execute(
        "UPDATE users SET cash_balance = ? WHERE id = ?",
        (cash_balance, user["id"]),
    )
    connection.execute(
        """
        INSERT INTO uploads (user_id, name, date_label, status, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            user["id"],
            filename,
            f"Uploaded {datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC')}",
            "Processed",
            utc_now_iso(),
        ),
    )
    connection.commit()

    return {
        "message": f"Uploaded {len(parsed_rows)} transactions and refreshed portfolio analytics.",
        "filename": filename,
        "columns": ["Date", "Type", "Symbol", "Quantity", "Price"],
        "row_count": len(parsed_rows),
        "preview": [
            {
                "Date": item["date"],
                "Type": item["type"],
                "Symbol": item["symbol"],
                "Quantity": item["quantity"],
                "Price": item["price"],
            }
            for item in parsed_rows[:3]
        ],
    }


def seed_demo_user(connection: sqlite3.Connection) -> None:
    existing = connection.execute("SELECT id FROM users WHERE email = ?", ("profile@financeai.app",)).fetchone()
    if existing:
        return

    salt, password_hash = make_password_fields("demo1234")
    cursor = connection.execute(
        """
        INSERT INTO users (
            full_name, email, password_salt, password_hash, plan, member_since,
            risk_preference, primary_goal, base_currency, reports, cash_balance, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "Portfolio User",
            "profile@financeai.app",
            salt,
            password_hash,
            "Starter",
            "March 2026",
            "Moderate",
            "Long-term growth",
            "USD",
            "Monthly summary enabled",
            6240.00,
            utc_now_iso(),
        ),
    )
    user_id = cursor.lastrowid

    for transaction in DEFAULT_TRANSACTIONS:
        connection.execute(
            """
            INSERT INTO transactions (user_id, date, type, symbol, quantity, price, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                transaction["date"],
                transaction["type"],
                transaction["symbol"],
                transaction["quantity"],
                transaction["price"],
                "starter_portfolio.csv",
            ),
        )

    connection.execute(
        "INSERT INTO watchlist (user_id, symbol, created_at) VALUES (?, ?, ?)",
        (user_id, "AMD", utc_now_iso()),
    )
    connection.execute(
        """
        INSERT INTO uploads (user_id, name, date_label, status, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, "starter_portfolio.csv", "Seeded for demo", "Processed", utc_now_iso()),
    )
    connection.execute(
        """
        INSERT INTO reports (user_id, title, meta, report_format, date_range, sections, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            "Portfolio Report - February 2026",
            "2026-03-01 | 1.4 MB",
            "PDF Document",
            "Last Month",
            "Portfolio Summary,Performance Analysis,Current Holdings",
            utc_now_iso(),
        ),
    )
    connection.execute(
        """
        INSERT INTO reports (user_id, title, meta, report_format, date_range, sections, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            "Quarterly Snapshot - Q1 2026",
            "2026-03-21 | 2.1 MB",
            "PDF Document",
            "Last Quarter",
            "Portfolio Summary,Risk Analysis,Current Holdings",
            utc_now_iso(),
        ),
    )
    connection.commit()


def init_db() -> None:
    with get_db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'Starter',
                member_since TEXT NOT NULL,
                risk_preference TEXT NOT NULL DEFAULT 'Moderate',
                primary_goal TEXT NOT NULL DEFAULT 'Long-term growth',
                base_currency TEXT NOT NULL DEFAULT 'USD',
                reports TEXT NOT NULL DEFAULT 'Monthly summary enabled',
                cash_balance REAL NOT NULL DEFAULT 5000,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                symbol TEXT NOT NULL,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                source TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, symbol),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                date_label TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                meta TEXT NOT NULL,
                report_format TEXT,
                date_range TEXT,
                sections TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS report_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email TEXT NOT NULL,
                report_name TEXT NOT NULL,
                queued_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        seed_demo_user(connection)


@app.on_event("startup")
def startup_event() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "FinanceAI API is running.", "docs": "/docs"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": utc_now_iso(), "database": DB_PATH.name}


@app.post("/api/auth/signup")
def signup(payload: SignupRequest) -> dict[str, Any]:
    with get_db() as connection:
        existing = connection.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        salt, password_hash = make_password_fields(payload.password)
        cursor = connection.execute(
            """
            INSERT INTO users (
                full_name, email, password_salt, password_hash, plan, member_since,
                risk_preference, primary_goal, base_currency, reports, cash_balance, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.full_name,
                payload.email,
                salt,
                password_hash,
                "Starter",
                datetime.now(UTC).strftime("%B %Y"),
                "Moderate",
                payload.goal,
                "USD",
                "Monthly summary enabled",
                10000.00,
                utc_now_iso(),
            ),
        )
        user_id = cursor.lastrowid
        connection.execute(
            """
            INSERT INTO uploads (user_id, name, date_label, status, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, "welcome_template.csv", "Ready for your first import", "Pending", utc_now_iso()),
        )
        token = create_session(connection, user_id)
        user = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return {"message": "Signup successful", "user": public_user_profile(user), "token": token}


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    with get_db() as connection:
        user = connection.execute("SELECT * FROM users WHERE email = ?", (payload.email,)).fetchone()
        if not user or not verify_password(payload.password, user["password_salt"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        token = create_session(connection, user["id"])

    return {"message": "Login successful", "user": public_user_profile(user), "token": token}


@app.get("/api/auth/me")
def auth_me(session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return {"user": public_user_profile(session["user"])}


@app.post("/api/auth/logout")
def logout(session: dict[str, Any] = Depends(current_user)) -> dict[str, str]:
    with get_db() as connection:
        connection.execute("DELETE FROM sessions WHERE token = ?", (session["token"],))
        connection.commit()
    return {"message": "Logged out successfully"}


@app.get("/api/profile/me")
def get_profile(session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    return public_user_profile(session["user"])


@app.put("/api/profile/me")
def update_profile(payload: ProfileUpdateRequest, session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    with get_db() as connection:
        duplicate = connection.execute(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            (payload.email, session["user"]["id"]),
        ).fetchone()
        if duplicate:
            raise HTTPException(status_code=409, detail="That email is already in use.")

        connection.execute(
            """
            UPDATE users
            SET full_name = ?, email = ?, risk_preference = ?, primary_goal = ?, base_currency = ?, reports = ?
            WHERE id = ?
            """,
            (
                payload.full_name,
                payload.email,
                payload.risk_preference,
                payload.primary_goal,
                payload.base_currency,
                payload.reports,
                session["user"]["id"],
            ),
        )
        connection.commit()
        user = connection.execute("SELECT * FROM users WHERE id = ?", (session["user"]["id"],)).fetchone()

    return {"message": "Profile updated", "profile": public_user_profile(user)}


@app.get("/api/dashboard")
def get_dashboard(session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    with get_db() as connection:
        user = connection.execute("SELECT * FROM users WHERE id = ?", (session["user"]["id"],)).fetchone()
        return dashboard_payload(connection, user)


@app.get("/api/uploads")
def get_upload_page_data(session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    with get_db() as connection:
        return uploads_payload(connection, session["user"]["id"])


@app.post("/api/uploads/transactions")
async def upload_transactions(
    file: UploadFile = File(...),
    session: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    filename = file.filename or "upload"
    contents = await file.read()

    with get_db() as connection:
        user = connection.execute("SELECT * FROM users WHERE id = ?", (session["user"]["id"],)).fetchone()

        if filename.lower().endswith(".csv"):
            decoded = contents.decode("utf-8", errors="ignore")
            reader = csv.DictReader(io.StringIO(decoded))
            rows = list(reader)
            if not rows:
                raise HTTPException(status_code=400, detail="CSV file is empty.")
            try:
                parsed_rows = [coerce_transaction(row) for row in rows]
                return insert_transactions(connection, user, parsed_rows, filename)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc

        if filename.lower().endswith((".xlsx", ".xls")):
            connection.execute(
                """
                INSERT INTO uploads (user_id, name, date_label, status, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    filename,
                    f"Uploaded {datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC')}",
                    "Reviewing",
                    utc_now_iso(),
                ),
            )
            connection.commit()
            return {
                "message": "Excel upload received. Review status has been added to recent uploads.",
                "filename": filename,
                "size_bytes": len(contents),
            }

    raise HTTPException(status_code=400, detail="Only CSV, XLSX, and XLS files are supported.")


@app.get("/api/risk")
def get_risk_analysis(session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    with get_db() as connection:
        user = connection.execute("SELECT * FROM users WHERE id = ?", (session["user"]["id"],)).fetchone()
        return risk_payload(connection, user)


@app.get("/api/recommendations")
def get_recommendations(session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    with get_db() as connection:
        user = connection.execute("SELECT * FROM users WHERE id = ?", (session["user"]["id"],)).fetchone()
        return recommendations_payload(connection, user)


@app.post("/api/recommendations/{ticker}/watchlist")
def add_to_watchlist(ticker: str, session: dict[str, Any] = Depends(current_user)) -> dict[str, str]:
    symbol = ticker.upper()
    with get_db() as connection:
        existing = connection.execute(
            "SELECT id FROM watchlist WHERE user_id = ? AND symbol = ?",
            (session["user"]["id"], symbol),
        ).fetchone()
        if existing:
            return {"message": f"{symbol} is already on your watchlist"}

        connection.execute(
            "INSERT INTO watchlist (user_id, symbol, created_at) VALUES (?, ?, ?)",
            (session["user"]["id"], symbol, utc_now_iso()),
        )
        connection.commit()
    return {"message": f"{symbol} added to watchlist"}


@app.get("/api/reports")
def get_reports(session: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    with get_db() as connection:
        return reports_payload(connection, session["user"]["id"])


@app.post("/api/reports/generate")
def generate_report(
    payload: ReportGenerateRequest,
    session: dict[str, Any] = Depends(current_user),
) -> dict[str, Any]:
    title = f"{payload.format} - {payload.date_range}"
    meta = f"{datetime.now().date().isoformat()} | {max(1, len(payload.sections)) * 0.6:.1f} MB"
    with get_db() as connection:
        connection.execute(
            """
            INSERT INTO reports (user_id, title, meta, report_format, date_range, sections, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session["user"]["id"],
                title,
                meta,
                payload.format,
                payload.date_range,
                ",".join(payload.sections),
                utc_now_iso(),
            ),
        )
        connection.commit()
    return {
        "message": f"Report generated with {len(payload.sections)} sections.",
        "report": {"title": title, "meta": meta},
        "format": payload.format,
        "sections": payload.sections,
    }


@app.post("/api/reports/email")
def email_report(payload: EmailReportRequest, session: dict[str, Any] = Depends(current_user)) -> dict[str, str]:
    with get_db() as connection:
        connection.execute(
            """
            INSERT INTO report_emails (user_id, email, report_name, queued_at)
            VALUES (?, ?, ?, ?)
            """,
            (session["user"]["id"], payload.email, payload.report_name, utc_now_iso()),
        )
        connection.commit()
    return {"message": f"{payload.report_name} queued for delivery to {payload.email}"}
