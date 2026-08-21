import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

import SelectedProducts from '../components/SelectedProducts';
import AdminSideMenu from '../components/SideMenuAdmin';
import '../styles/ProductList.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [currentSection, setCurrentSection] = useState('menu');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/api/producto');
                setProducts(response.data);
            } catch (error) {
                console.error('Error al cargar productos:', error);
            }
        };

        fetchProducts();
    }, []);

    const handleAddProduct = (product) => {
        const availableQuantity = product.cantidad_disponible;
        console.log('Cantidad disponible:', availableQuantity);

        // Verificar si la cantidad disponible es mayor que 0
        if (availableQuantity <= 0) {
            Swal.fire({
                title: '¡Sin Stock!',
                text: `El producto ${product.nombre} no está disponible en stock.`,
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
            return; // No permitimos agregar al carrito si no hay stock
        }

        // Buscamos si el producto ya está en el carrito
        const existingProduct = selectedProducts.find(p => p.product.id === product.id);

        if (existingProduct) {
            // Verificamos si la cantidad en el carrito es menor que la cantidad disponible
            if (existingProduct.quantity < availableQuantity) {
                setSelectedProducts(
                    selectedProducts.map(p =>
                        p.product.id === product.id
                            ? { ...p, quantity: p.quantity + 1 }
                            : p
                    )
                );
            } else {
                // Si la cantidad solicitada supera la disponible
                Swal.fire({
                    title: '¡Stock Limitado!',
                    text: `No puedes añadir más de ${availableQuantity} unidades de ${product.nombre}.`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar',
                });
            }
        } else {
            // Si el producto no está en el carrito, lo agregamos con una cantidad inicial de 1
            setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
        }
    };




    const handleUpdateQuantity = (id, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveProduct(id);
        } else {
            setSelectedProducts(
                selectedProducts.map(p =>
                    p.product.id === id ? { ...p, quantity: newQuantity } : p
                )
            );
        }
    };

    const handleRemoveProduct = (id) => {
        setSelectedProducts(selectedProducts.filter(p => p.product.id !== id));
    };

    const filteredProducts = (description) =>
        products.filter(product => product.descripcion === description);

    const handleClearCart = () => {
        setSelectedProducts([]);
    };

    return (
        <div className="row">
            {/* Menú lateral */}
            <div className="sidemenu-producto">
                <AdminSideMenu />
            </div>

            {/* Contenido principal */}
            <div className="col-md-10">
                <div className="section-buttons">
                    <button onClick={() => setCurrentSection('menu')} className={`section-btn ${currentSection === 'menu' ? 'active' : ''}`}>
                        Snacks
                    </button>
                    <button onClick={() => setCurrentSection('bebidas')} className={`section-btn ${currentSection === 'bebidas' ? 'active' : ''}`}>
                        Bebidas
                    </button>
                    <button onClick={() => setCurrentSection('limpieza')} className={`section-btn ${currentSection === 'limpieza' ? 'active' : ''}`}>
                        Limpieza
                    </button>
                    <button onClick={() => setCurrentSection('viveres')} className={`section-btn ${currentSection === 'viveres' ? 'active' : ''}`}>
                        Viveres
                    </button>
                </div>
                {/* Categorias */}
                <div className="category-container">
                    {currentSection === 'menu' && (
                        <>
                            <Category title="Snacks" products={filteredProducts('Snacks')} onAdd={handleAddProduct} />
                        </>
                    )}
                    {currentSection === 'bebidas' && (
                        <>
                            <Category title="Bebidas" products={filteredProducts('Bebidas')} onAdd={handleAddProduct} />
                        </>
                    )}
                    {currentSection === 'limpieza' && (
                        <>
                            <Category title="Limpieza" products={filteredProducts('Limpieza')} onAdd={handleAddProduct} />
                        </>
                    )}
                    {currentSection === 'viveres' && (
                        <>
                            <Category title="Viveres" products={filteredProducts('Viveres')} onAdd={handleAddProduct} />
                        </>
                    )}
                </div>

                <div className="selected-products-container">
                    <SelectedProducts
                        selectedProducts={selectedProducts}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveProduct}
                        clearCart={handleClearCart}
                    />
                </div>
            </div>
        </div>

    );
};

const Category = ({ title, products, onAdd }) => (
    <div className="category">
        <h3>{title}</h3>
        <div className="product-list">
            {products.map(product => (
                <div key={product.id} className="product-item">
                    <button onClick={() => onAdd(product)} className="product-btn">
                        {product.nombre}
                    </button>
                    <span className="product-price">${product.precio}</span>
                </div>
            ))}
        </div>
    </div>
);

export default ProductList;
