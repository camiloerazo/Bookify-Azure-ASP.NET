import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

interface PayPalButtonProps {
    amount: number;
    reservationId: number;
    onSuccess: () => void;
    onError: (error: string) => void;
}

export default function PayPalButton({ amount, reservationId, onSuccess, onError }: PayPalButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const createOrder = async () => {
        try {
            setIsProcessing(true);
            const response = await fetch("https://localhost:7035/api/payment/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount,
                    reservationId
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Backend error response:", errorBody);
                throw new Error("Failed to create PayPal order");
            }

            const order = await response.json();
            console.log("Received order from backend:", order);
            console.log("Order ID from backend:", order.id);
            return order.id;
        } catch (error) {
            onError(error instanceof Error ? error.message : "Failed to create order");
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const onApprove = async (data: { orderID: string }) => {
        try {
            setIsProcessing(true);
            const response = await fetch("https://localhost:7035/api/payment/capture-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: data.orderID
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to capture payment");
            }

            const captureData = await response.json();
            if (captureData.status === "COMPLETED") {
                onSuccess();
            } else {
                throw new Error("Payment not completed");
            }
        } catch (error) {
            onError(error instanceof Error ? error.message : "Failed to capture payment");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <PayPalScriptProvider options={{ 
            clientId: "AbYtuUWECUBh6_pdV5qQUceCO0-sLTRJMLzyWGxmqCzywv77UlosFfCE17yMa6LjvnEjcXVc5KtHo1xh",
            currency: "USD",
            locale: "es_ES"
        }}>
            <div style={{ maxWidth: "300px" }}>
                <PayPalButtons
                    style={{ layout: "vertical" }}
                    disabled={isProcessing}
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={(err: any) => onError(err.message)}
                />
            </div>
        </PayPalScriptProvider>
    );
} 