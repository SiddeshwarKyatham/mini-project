import os
import tensorflow as tf
from tensorflow.keras.models import Sequential # type: ignore
from tensorflow.keras.layers import Conv1D, GlobalAveragePooling1D, Dense, Dropout # type: ignore
from tensorflow.keras.callbacks import EarlyStopping # type: ignore
from sklearn.metrics import classification_report, accuracy_score
import preprocess

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ddos_cnn.keras")

def build_model(input_shape):
    model = Sequential([
        Conv1D(64, kernel_size=3, activation='relu', input_shape=input_shape),
        Conv1D(128, kernel_size=3, activation='relu'),
        GlobalAveragePooling1D(),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

def main():
    print("Loading and preprocessing data (this may take a moment)...")
    X_train, X_test, y_train, y_test = preprocess.load_and_preprocess()
    
    print(f"Training on {len(X_train)} samples, validating on {len(X_test)} samples...")
    print(f"Input shape: {X_train.shape[1:]}")
    
    model = build_model(input_shape=X_train.shape[1:])
    model.summary()
    
    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    
    model.fit(
        X_train, y_train,
        epochs=30,
        batch_size=64,
        validation_split=0.2, # Use part of train for validation in early stopping
        callbacks=[early_stop],
        verbose=1
    )
    
    print("Evaluating model...")
    y_pred_prob = model.predict(X_test)
    y_pred = (y_pred_prob > 0.5).astype(int)
    
    acc = accuracy_score(y_test, y_pred)
    print(f"\\nAccuracy on test set: {acc * 100:.2f}%")
    print("\\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Normal", "DDoS"]))
    
    print(f"Saving model to {MODEL_PATH}...")
    model.save(MODEL_PATH)
    print("Done!")

if __name__ == "__main__":
    main()
