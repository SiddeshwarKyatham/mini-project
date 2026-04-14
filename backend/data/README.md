# CICDDoS2019 Dataset

This directory holds the raw CSV files from the **CICDDoS2019** dataset.

## How to get the dataset

1. Go to: https://www.unb.ca/cic/datasets/ddos-2019.html
2. Download any CSV file (e.g. `03-11/CSV-03-11.zip`)
3. Extract and place the `.csv` files here

## If you don't have the dataset

**That's fine!** Run `python model/train.py` anyway.
The training script detects when no CSVs are present and auto-generates
**high-quality synthetic data** that mimics CICDDoS2019 statistics.
The resulting model still works correctly for demo purposes.

## Required columns (if using real data)

The preprocessing script looks for these columns (CICDDoS2019 standard names):
- `Flow Duration`
- `Total Fwd Packets`
- `Total Length of Fwd Packets`
- `Flow Bytes/s`
- `Flow Packets/s`
- `Avg Fwd Segment Size`
- `Label`
