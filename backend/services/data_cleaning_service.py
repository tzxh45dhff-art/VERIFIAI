"""
VerifAI — Data cleaning service for uploaded datasets.
Handles dedup, nulls, outliers, encoding, and standardization.
"""
import pandas as pd
import numpy as np
from models.schemas import CleaningReport
from loguru import logger


class DataCleaningService:

    def clean(self, df: pd.DataFrame) -> tuple[CleaningReport, pd.DataFrame]:
        """Clean a DataFrame and return a report + cleaned copy."""
        issues_found = []
        df_clean = df.copy()

        # 1. Fix encoding issues in string columns
        for col in df_clean.select_dtypes(include="object").columns:
            try:
                df_clean[col] = df_clean[col].apply(
                    lambda x: x.encode("ascii", "ignore").decode("ascii")
                    if isinstance(x, str) else x
                )
            except Exception:
                pass

        # 2. Remove duplicate rows
        dupes = df_clean.duplicated().sum()
        if dupes > 0:
            df_clean = df_clean.drop_duplicates()
            issues_found.append(f"Removed {dupes} duplicate rows")

        # 3. Handle missing values
        for col in df_clean.columns:
            null_count = int(df_clean[col].isnull().sum())
            if null_count > 0:
                if df_clean[col].dtype in ["float64", "int64", "float32", "int32"]:
                    fill_val = df_clean[col].median()
                    df_clean[col] = df_clean[col].fillna(fill_val)
                    issues_found.append(
                        f"Column '{col}': filled {null_count} nulls with median ({fill_val:.2f})"
                    )
                else:
                    df_clean[col] = df_clean[col].fillna("Unknown")
                    issues_found.append(
                        f"Column '{col}': filled {null_count} nulls with 'Unknown'"
                    )

        # 4. Detect and flag outliers (IQR method)
        outlier_cols = {}
        for col in df_clean.select_dtypes(include="number").columns:
            Q1 = df_clean[col].quantile(0.25)
            Q3 = df_clean[col].quantile(0.75)
            IQR = Q3 - Q1
            if IQR == 0:
                continue
            outliers = df_clean[
                (df_clean[col] < Q1 - 3 * IQR) | (df_clean[col] > Q3 + 3 * IQR)
            ]
            if len(outliers) > 0:
                outlier_cols[col] = len(outliers)
                issues_found.append(
                    f"Column '{col}': {len(outliers)} extreme outliers detected (keeping, flagged)"
                )

        # 5. Standardize categorical values
        for col in df_clean.select_dtypes(include="object").columns:
            df_clean[col] = df_clean[col].str.strip().str.lower()

        # 6. Validate binary target columns
        for col in df_clean.columns:
            if df_clean[col].nunique() == 2:
                vals = sorted(df_clean[col].unique())
                if set(vals) != {0, 1}:
                    mapping = {vals[0]: 0, vals[1]: 1}
                    df_clean[col] = df_clean[col].map(mapping)
                    issues_found.append(f"Column '{col}': mapped {vals} → {{0, 1}}")

        report = CleaningReport(
            original_rows=len(df),
            clean_rows=len(df_clean),
            issues_fixed=issues_found,
            outlier_columns=outlier_cols,
        )

        return report, df_clean


data_cleaning_service = DataCleaningService()
