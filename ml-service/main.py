import os
from pathlib import Path
from typing import Optional
from datetime import datetime

from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, HTTPException, Header, Depends
import pandas as pd
import numpy as np
import joblib
from sklearn.linear_model import LinearRegression

from database import engine

app = FastAPI(title="IntelliStock ML Service")

MODEL_PATH = Path("models") / "sales_model.pkl"

ML_API_KEY = os.getenv("ML_API_KEY")


def require_api_key(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    if not ML_API_KEY:
        raise HTTPException(status_code=500, detail="ML_API_KEY is not configured")
    if not x_api_key or x_api_key != ML_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return x_api_key


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "IntelliStock ML Service Running"}


# ── Sales data preview ────────────────────────────────────────────────────────
@app.get("/sales-data")
def get_sales_data(_auth=Depends(require_api_key)):
    query = """
        SELECT product_id, quantity, total_amount, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)
    return {
        "rows": len(df),
        "preview": df.head().to_dict(orient="records")
    }


# ── Train model (POST — triggers a state change) ──────────────────────────────
@app.post("/train-model")
def train_model(_auth=Depends(require_api_key)):
    query = """
        SELECT quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)

    if df.empty:
        raise HTTPException(status_code=422, detail="No sales data available to train on")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    daily_sales = df.groupby("sale_date")["quantity"].sum().reset_index()
    daily_sales["day_number"] = np.arange(len(daily_sales))

    X = daily_sales[["day_number"]]
    y = daily_sales["quantity"]

    model = LinearRegression()
    model.fit(X, y)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return {
        "message": "Model trained and saved successfully",
        "data_points": len(daily_sales)
    }


# ── 7-day sales forecast ──────────────────────────────────────────────────────
@app.get("/forecast")
def forecast(_auth=Depends(require_api_key)):
    if not MODEL_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Model not trained yet. POST to /train-model first."
        )

    try:
        model = joblib.load(MODEL_PATH)
    except (EOFError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {exc}")

    query = """
        SELECT quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)

    if df.empty:
        raise HTTPException(status_code=422, detail="No sales data available for forecasting")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    daily_sales = df.groupby("sale_date")["quantity"].sum().reset_index()
    last_day_number = len(daily_sales) - 1

    future_days = np.arange(last_day_number + 1, last_day_number + 8).reshape(-1, 1)
    predictions = model.predict(future_days)

    return {
        "next_7_days_forecast": [round(max(0, p), 2) for p in predictions.tolist()]
    }


# ── Per Product 7-day Forecast ─────────────────────────────────────────────────
@app.get("/product-forecast")
def product_forecast(_auth=Depends(require_api_key)):
    product_query = """
        SELECT id
        FROM products
        WHERE is_active = TRUE
        ORDER BY id
    """
    sales_query = """
        SELECT product_id, quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """

    products_df = pd.read_sql(product_query, engine)
    sales_df = pd.read_sql(sales_query, engine)

    if products_df.empty:
        raise HTTPException(status_code=422, detail="No active products available")

    minimum_history_points = 3
    forecasts = {}
    insufficient_products = []

    if not sales_df.empty:
        sales_df["sale_date"] = pd.to_datetime(sales_df["sale_date"])

    for product_id in products_df["id"].tolist():
        product_df = sales_df[sales_df["product_id"] == product_id] if not sales_df.empty else pd.DataFrame()

        daily_sales = (
            product_df.groupby("sale_date")["quantity"]
            .sum()
            .reset_index()
        ) if not product_df.empty else pd.DataFrame(columns=["sale_date", "quantity"])

        history_points = len(daily_sales)
        if history_points < minimum_history_points:
            insufficient_products.append({
                "product_id": int(product_id),
                "history_points": int(history_points),
                "minimum_required": minimum_history_points
            })
            continue

        daily_sales["day_number"] = np.arange(len(daily_sales))
        X = daily_sales[["day_number"]]
        y = daily_sales["quantity"]

        model = LinearRegression()
        model.fit(X, y)

        last_day_number = len(daily_sales) - 1
        future_days = np.arange(last_day_number + 1, last_day_number + 8).reshape(-1, 1)
        predictions = model.predict(future_days)

        confidence = min(0.99, history_points / 30)
        forecasts[int(product_id)] = {
            "forecast_total_next_7_days": round(max(0, sum(predictions)), 2),
            "history_points": int(history_points),
            "confidence": round(float(confidence), 2)
        }

    return {
        "product_forecasts": forecasts,
        "metadata": {
            "minimum_history_points": minimum_history_points,
            "insufficient_products": insufficient_products,
            "sufficient_products": len(forecasts),
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
    }


# ── TREND ANALYSIS (Growing / Declining / Stable) ──────────────────────────────
@app.get("/trend-analysis")
def trend_analysis(_auth=Depends(require_api_key)):
    """
    Analyzes sales trend using linear regression slope.
    Returns: Growing | Declining | Stable
    """
    query = """
        SELECT quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)

    if df.empty:
        raise HTTPException(status_code=422, detail="No sales data available")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    daily_sales = df.groupby("sale_date")["quantity"].sum().reset_index()

    daily_sales["day_number"] = np.arange(len(daily_sales))

    X = daily_sales[["day_number"]]
    y = daily_sales["quantity"]

    model = LinearRegression()
    model.fit(X, y)

    slope = float(model.coef_[0])

    if slope > 0.5:
        trend = "📈 Growing"
    elif slope < -0.5:
        trend = "📉 Declining"
    else:
        trend = "➖ Stable"

    return {
        "trend": trend,
        "slope": slope,
        "interpretation": f"Daily sales changing by {slope:.2f} units per day"
    }


# ── MOVING AVERAGE (7-day smoothed trend) ──────────────────────────────────────
@app.get("/moving-average")
def moving_average(_auth=Depends(require_api_key)):
    """
    Calculates 7-day moving average to smooth out noise.
    Useful for chart visualization.
    """
    query = """
        SELECT quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)

    if df.empty:
        raise HTTPException(status_code=422, detail="No sales data available")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    daily_sales = df.groupby("sale_date")["quantity"].sum().reset_index()

    daily_sales["moving_avg_7"] = daily_sales["quantity"].rolling(window=7, center=True).mean()

    return {
        "dates": [d.strftime("%Y-%m-%d") for d in daily_sales["sale_date"]],
        "actual_values": daily_sales["quantity"].tolist(),
        "moving_average_7day": [round(x, 2) if not pd.isna(x) else None for x in daily_sales["moving_avg_7"]]
    }


# ── SEASONALITY ANALYSIS (Weekly patterns) ─────────────────────────────────────
@app.get("/seasonality-analysis")
def seasonality_analysis(_auth=Depends(require_api_key)):
    """
    Analyzes sales patterns by day of week.
    Identifies peak days and low days.
    """
    query = """
        SELECT quantity, sale_date
        FROM sales
    """
    df = pd.read_sql(query, engine)

    if df.empty:
        raise HTTPException(status_code=422, detail="No sales data available")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    df["weekday"] = df["sale_date"].dt.day_name()

    seasonality = df.groupby("weekday")["quantity"].agg(["mean", "sum", "count"]).round(2).to_dict("index")

    peak_day = df.groupby("weekday")["quantity"].mean().idxmax()
    low_day = df.groupby("weekday")["quantity"].mean().idxmin()

    return {
        "weekly_pattern": seasonality,
        "peak_day": peak_day,
        "low_day": low_day,
        "insight": f"Peak sales on {peak_day}, lowest on {low_day}"
    }


# ── ANOMALY DETECTION (2-sigma outliers) ──────────────────────────────────────
@app.get("/anomaly-detection")
def anomaly_detection(_auth=Depends(require_api_key)):
    """
    Detects unusual sales spikes using statistical methods.
    Flags values > mean + 2*std as anomalies.
    """
    query = """
        SELECT quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)

    if df.empty:
        raise HTTPException(status_code=422, detail="No sales data available")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    daily_sales = df.groupby("sale_date")["quantity"].sum().reset_index()

    mean = daily_sales["quantity"].mean()
    std = daily_sales["quantity"].std()
    threshold = mean + (2 * std)

    anomalies = daily_sales[daily_sales["quantity"] > threshold]

    return {
        "mean_sales": round(float(mean), 2),
        "std_deviation": round(float(std), 2),
        "threshold": round(float(threshold), 2),
        "anomaly_count": len(anomalies),
        "anomaly_dates": [d.strftime("%Y-%m-%d") for d in anomalies["sale_date"]],
        "anomaly_values": anomalies["quantity"].round(2).tolist()
    }


# ── FORECAST VS ACTUAL (Model Accuracy) ──────────────────────────────────────
@app.get("/forecast-vs-actual")
def forecast_vs_actual(_auth=Depends(require_api_key)):
    """
    Compares model predictions with actual values.
    Calculates MAPE (Mean Absolute Percentage Error).
    """
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=404, detail="Model not trained yet")

    try:
        model = joblib.load(MODEL_PATH)
    except (EOFError, ValueError) as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {exc}")

    query = """
        SELECT quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)

    if df.empty:
        raise HTTPException(status_code=422, detail="No sales data available")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    daily_sales = df.groupby("sale_date")["quantity"].sum().reset_index()

    # Get predictions for all historical days
    daily_sales["day_number"] = np.arange(len(daily_sales))
    X = daily_sales[["day_number"]].values
    predictions = model.predict(X)

    # Calculate MAPE
    actual = daily_sales["quantity"].values
    mape = np.mean(np.abs((actual - predictions) / actual)) * 100

    accuracy = 100 - mape

    return {
        "mape_error_percent": round(float(mape), 2),
        "accuracy_percent": round(float(accuracy), 2),
        "data_points": len(daily_sales),
        "interpretation": f"Model accuracy: {accuracy:.1f}%" if accuracy > 50 else "⚠️ Model needs retraining"
    }


# ── GROWTH RATE (Period-over-period) ───────────────────────────────────────────
@app.get("/growth-rate")
def growth_rate(_auth=Depends(require_api_key)):
    """
    Calculates week-over-week and month-over-month growth rates.
    """
    query = """
        SELECT quantity, sale_date
        FROM sales
        ORDER BY sale_date
    """
    df = pd.read_sql(query, engine)

    if len(df) < 14:
        raise HTTPException(status_code=422, detail="Insufficient data for growth rate calculation")

    df["sale_date"] = pd.to_datetime(df["sale_date"])
    daily_sales = df.groupby("sale_date")["quantity"].sum().reset_index()

    # Week-over-week
    weekly_sales = daily_sales.set_index("sale_date").resample("W")["quantity"].sum()
    if len(weekly_sales) > 1:
        wow_growth = ((weekly_sales.iloc[-1] - weekly_sales.iloc[-2]) / weekly_sales.iloc[-2] * 100)
    else:
        wow_growth = 0

    # Latest vs first week
    first_week_total = daily_sales.iloc[:7]["quantity"].sum()
    last_week_total = daily_sales.iloc[-7:]["quantity"].sum()
    overall_growth = ((last_week_total - first_week_total) / first_week_total * 100)

    return {
        "week_over_week_growth_percent": round(float(wow_growth), 2),
        "overall_growth_percent": round(float(overall_growth), 2),
        "first_week_sales": round(float(first_week_total), 2),
        "last_week_sales": round(float(last_week_total), 2)
    }
