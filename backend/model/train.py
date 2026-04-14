"""
train.py - Trains the 1D-CNN DDoS detection model for Traffic Tamer.

Improvements over v1:
  - Always regenerates balanced synthetic data (force_synthetic=True) to pick up
    the new feature distributions in preprocess.py.
  - Uses sklearn class_weight to handle any residual class imbalance.
  - 50 max epochs with EarlyStopping (patience=7).
  - Prints a full classification report so you can see per-class performance.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential            # type: ignore
from tensorflow.keras.layers import (                     # type: ignore
    Conv1D, GlobalAveragePooling1D, Dense, Dropout, BatchNormalization,
)
from tensorflow.keras.callbacks import EarlyStopping      # type: ignore
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils.class_weight import compute_class_weight
import preprocess

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ddos_cnn.keras")


def build_model(input_shape):
    """
    1D-CNN for binary classification of network traffic sequences.

    Architecture:
      Conv1D(64)  -> local pattern detection (burst shape)
      Conv1D(128) -> higher-order temporal patterns
      Conv1D(64)  -> additional smoothing (helps with 20-step windows)
      GlobalAveragePooling -> sequence -> fixed-length embedding
      Dense(64) + Dropout -> fully-connected classifier
      Dense(1, sigmoid)   -> DDoS probability
    """
    model = Sequential([
        Conv1D(64,  kernel_size=3, activation="relu",
               input_shape=input_shape, padding="same"),
        BatchNormalization(),
        Conv1D(128, kernel_size=3, activation="relu", padding="same"),
        BatchNormalization(),
        Conv1D(64,  kernel_size=3, activation="relu", padding="same"),
        GlobalAveragePooling1D(),
        Dense(64, activation="relu"),
        Dropout(0.3),
        Dense(1, activation="sigmoid"),
    ])
    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    print("=" * 60)
    print("  Traffic Tamer - 1D-CNN Training")
    print("=" * 60)

    # -- Load data ------------------------------------------------─
    # force_synthetic=True regenerates from the improved preprocess.py
    # so we always train on the new balanced, temporally-structured data.
    print("\n[1/4] Generating & preprocessing data...")
    X_train, X_test, y_train, y_test = preprocess.load_and_preprocess(
        force_synthetic=True
    )
    print(f"  Train: {X_train.shape}  Test: {X_test.shape}")
    print(f"  Train DDoS%: {y_train.mean()*100:.1f}%  "
          f"Test DDoS%: {y_test.mean()*100:.1f}%")

    # -- Class weights ----------------------------------------------
    # Even with a 50/50 source split, the sliding-window labelling
    # (last-row label) can shift the ratio slightly - class_weight
    # corrects for any residual imbalance.
    print("\n[2/4] Computing class weights...")
    classes = np.unique(y_train)
    weights = compute_class_weight("balanced", classes=classes, y=y_train)
    class_weight_dict = dict(zip(classes.tolist(), weights.tolist()))
    print(f"  Class weights: {class_weight_dict}")

    # -- Build & summarise model ------------------------------------
    print("\n[3/4] Building model...")
    model = build_model(input_shape=X_train.shape[1:])
    model.summary()

    # -- Train ------------------------------------------------------
    print("\n[4/4] Training (up to 50 epochs, early-stop patience=7)...")
    early_stop = EarlyStopping(
        monitor="val_loss",
        patience=7,
        restore_best_weights=True,
        verbose=1,
    )

    model.fit(
        X_train, y_train,
        epochs=50,
        batch_size=64,
        validation_split=0.2,
        callbacks=[early_stop],
        class_weight=class_weight_dict,
        verbose=1,
    )

    # -- Evaluate --------------------------------------------------─
    print("\n--- Evaluation on held-out test set ---")
    y_pred_prob = model.predict(X_test, verbose=0)
    y_pred = (y_pred_prob > 0.5).astype(int).flatten()

    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy : {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred,
                                target_names=["Normal", "DDoS"]))

    # -- Save --------------------------------------------------------
    print(f"Saving model -> {MODEL_PATH}")
    model.save(MODEL_PATH)
    print("Done! Restart app.py to load the new model.")


if __name__ == "__main__":
    main()
