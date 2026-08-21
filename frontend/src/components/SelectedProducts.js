import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../styles/ProductList.css";
const SelectedProducts = ({ selectedProducts, onUpdateQuantity, onRemove, clearCart }) => {
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        const total = selectedProducts.reduce((sum, { product, quantity }) => {
            return sum + parseFloat(product.precio) * quantity;
        }, 0);
        setTotalPrice(total);
    }, [selectedProducts]);

    const handleQuantityChange = (id, change) => {
        const product = selectedProducts.find((p) => p.product.id === id);
        const newQuantity = Math.max(0, (product.quantity || 0) + change);
        onUpdateQuantity(id, newQuantity);
    };

const handleAcceptPurchase = async () => {
    if (selectedProducts.length === 0) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No tienes productos seleccionados para enviar a cocina.",
        });
        return;
    }

    try {
        const userId = parseInt(localStorage.getItem("userId"), 10);

        const pedidoData = {
            userId: userId,
            totalPrice: parseFloat(totalPrice),
            productos: selectedProducts.map(({ product, quantity }) => ({
                productId: product.id,
                quantity: quantity,
                price: product.precio,
            })),
        };

        const response = await axios.post("/api/pedido", pedidoData);

        Swal.fire({
            icon: "success",
            title: "Venta Exitosa",
            text: `Número de Pedido: ${response.data.pedidoId}`,
            confirmButtonText: "Aceptar",
        }).then((result) => {
            if (result.isConfirmed) {
                imprimirTicketCocina(response.data.pedidoId);

                if (typeof clearCart === "function") {
                    clearCart();
                } else {
                    console.warn("clearCart no está definida o no es una función.");
                }
            }
        });
    } catch (error) {
        console.error("Error al enviar el pedido:", error);

        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Hubo un problema al enviar el pedido. Intenta de nuevo.",
        });
    }
};

const imprimirTicketCocina = async (pedidoId) => {
    try {
        const response = await axios.post("api/print/imprimir-pedido", {
            pedidoId,
            productos: selectedProducts.map(({ product, quantity }) => ({
                nombre: product.nombre,
                cantidad: quantity,
                precio: parseFloat(product.precio), // ✅ Asegúrate de que es un número
            })),
            totalPrice,
        });

        console.log(response.data);
    } catch (error) {
        console.error("Error al imprimir el ticket:", error);
    }
};


    return (
        <div className="selected-products-container">
            <h2>Productos Seleccionados</h2>
            <div className="product-list">
                {selectedProducts.length === 0 ? (
                    <p>No has seleccionado productos</p>
                ) : (
                    selectedProducts.map(({ product, quantity }) => (
                        <div key={product.id} className="product-item">
                            <div className="product-info">
                                <span className="product-name">{product.nombre}</span>
                                <span className="product-price">${product.precio}</span>
                            </div>
                            <div className="quantity-control">
                                <button
                                    onClick={() => handleQuantityChange(product.id, -1)}
                                    className="quantity-btn decrement-btn"
                                >
                                    -
                                </button>
                                <span className="quantity-display">{quantity}</span>
                                <button
                                    onClick={() => handleQuantityChange(product.id, 1)}
                                    className="quantity-btn increment-btn"
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => onRemove(product.id)}
                                    className="remove-btn"
                                >
                                    Quitar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="total-price">
                <h3>Total: ${totalPrice.toFixed(2)}</h3>
            </div>

            <button onClick={handleAcceptPurchase} className="accept-btn">
                Enviar venta
            </button>
        </div>
    );
};

export default SelectedProducts;
