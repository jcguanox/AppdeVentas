import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/NavBar';
import Swal from 'sweetalert2';
import AdminSideMenu from '../components/SideMenuAdmin';
import '../styles/Inventory.css';
import { Modal, Button, Form, Row, Col, Card } from 'react-bootstrap';
import { FaSearch } from "react-icons/fa";
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Inventory = () => {
    const [section, setSection] = useState('productos');
    const [products, setProducts] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [mostSoldProduct, setMostSoldProduct] = useState('');
    const [newProduct, setNewProduct] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        cantidad_disponible: '',
        categoria_id: '',
    });
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        description: '',
    });
    const [currentPage, setCurrentPage] = useState(1); // Página actual
    const [itemsPerPage] = useState(10); // Elementos por página

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/producto');
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (error) {
            if (error.response) {
                setError(`Error ${error.response.status}: ${error.response.data.message || 'Error al obtener los datos'}`);
            } else if (error.request) {
                setError('No se pudo conectar con el servidor');
            } else {
                setError(`Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchProductoTop = async () => {
        try {
            const response = await axios.get('/api/pedido/top/pedidos');
            setPedidos(response.data);
        } catch (error) {
            if (error.response) {
                setError(`Error ${error.response.status}: ${error.response.data.message || 'Error al obtener los datos'}`);
            } else if (error.request) {
                setError('No se pudo conectar con el servidor');
            } else {
                setError(`Error: ${error.message}`);
            }
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchProductoTop();
    }, []);

    const applyFilters = useCallback(() => {
        let filtered = products;

        if (filters.search) {
            filtered = filtered.filter(product =>
                product.nombre.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        if (filters.category) {
            filtered = filtered.filter(product => product.categoria_id === parseInt(filters.category));
        }

        if (filters.description) {
            filtered = filtered.filter(product => product.descripcion === filters.description);
        }

        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [products, filters]);

    useEffect(() => {
        applyFilters();
    }, [filters, applyFilters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const categoryMap = {
        1: "Menú",
        2: "Bebidas",
        3: "Limpieza",
        4: "Viveres"
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    useEffect(() => {
        if (pedidos.length > 0) {
            const productosVendidos = {};

            pedidos.forEach(pedido => {
                const nombreProducto = pedido.producto_nombre;
                const cantidad = pedido.cantidad;

                if (productosVendidos[nombreProducto]) {
                    productosVendidos[nombreProducto] += cantidad;
                } else {
                    productosVendidos[nombreProducto] = cantidad;
                }
            });

            // Encontrar el producto con la mayor cantidad vendida
            let topProducto = '';
            let maxCantidad = 0;

            for (const [nombreProducto, cantidad] of Object.entries(productosVendidos)) {
                if (cantidad > maxCantidad) {
                    maxCantidad = cantidad;
                    topProducto = nombreProducto;
                }
            }

            // Actualizar el estado con el producto más vendido
            setMostSoldProduct(topProducto);
        }
    }, [pedidos]);

    // Calcular los productos para la página actual
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    // Cambiar de página
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Componente de paginación
    const Pagination = () => {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

        return (
            <nav>
                <ul className="pagination justify-content-center">
                    {/* Botón Atrás */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            className="page-link"
                            disabled={currentPage === 1}
                        >
                            Atrás
                        </button>
                    </li>

                    {/* Página Actual */}
                    <li className="page-item active">
                        <span className="page-link">
                            Página {currentPage} de {totalPages}
                        </span>
                    </li>

                    {/* Botón Siguiente */}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            className="page-link"
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };
    const handleEdit = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    // Función para cerrar el modal
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setNewProduct({ // Limpia el estado del nuevo producto
            nombre: '',
            descripcion: '',
            precio: '',
            cantidad_disponible: '',
            categoria_id: '',
        });
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();

        try {
            const productoAnterior = products.find(p => p.id === selectedProduct.id);

            if (!productoAnterior) {
                Swal.fire('Error', 'No se encontró el producto.', 'error');
                return;
            }

            // Crear un array para almacenar los cambios
            const cambios = [];

            // Comparar cada campo y registrar los cambios
            if (productoAnterior.nombre !== selectedProduct.nombre) {
                cambios.push(`Nombre: "${productoAnterior.nombre}" → "${selectedProduct.nombre}"`);
            }

            if (productoAnterior.descripcion !== selectedProduct.descripcion) {
                cambios.push(`Descripción: "${productoAnterior.descripcion}" → "${selectedProduct.descripcion}"`);
            }

            if (productoAnterior.precio !== selectedProduct.precio) {
                cambios.push(`Precio: $${productoAnterior.precio} → $${selectedProduct.precio}`);
            }

            if (productoAnterior.cantidad_disponible !== selectedProduct.cantidad_disponible) {
                const diferencia = selectedProduct.cantidad_disponible - productoAnterior.cantidad_disponible;
                if (diferencia > 0) {
                    cambios.push(`Se agregaron ${diferencia} unidades.`);
                } else if (diferencia < 0) {
                    cambios.push(`Se quitaron ${Math.abs(diferencia)} unidades.`);
                }
            }

            if (productoAnterior.categoria_id !== selectedProduct.categoria_id) {
                cambios.push(`Categoría: "${categoryMap[productoAnterior.categoria_id]}" → "${categoryMap[selectedProduct.categoria_id]}"`);
            }

            let detalleBitacora;
            if (cambios.length > 0) {
                detalleBitacora = `Se editó el producto "${selectedProduct.nombre}". Cambios: ${cambios.join(', ')}.`;
            } else {
                detalleBitacora = `Se editó el producto "${selectedProduct.nombre}" (sin cambios).`;
            }

            await axios.put(`api/producto/actualizar-producto/${selectedProduct.id}`, {
                nombre: selectedProduct.nombre,
                descripcion: selectedProduct.descripcion,
                precio: selectedProduct.precio,
                cantidad_disponible: selectedProduct.cantidad_disponible,
                categoria_id: selectedProduct.categoria_id,
            });

            // Mostrar mensaje de éxito
            Swal.fire('¡Actualizado!', 'El producto ha sido actualizado exitosamente.', 'success');

            // Registrar la acción en la bitácora
            await logAction('Inventario', 'Editar Producto', detalleBitacora, localStorage.getItem('userId')); // Cambia el 3 por el ID del usuario que realiza la acción

            // Actualizar la lista de productos y cerrar el modal
            fetchProducts();
            handleCloseModal();
        } catch (error) {
            // Manejar errores
            if (error.response) {
                Swal.fire('Error', `Error ${error.response.status}: ${error.response.data.message || 'No se pudo actualizar el producto.'}`, 'error');
            } else if (error.request) {
                Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
            } else {
                Swal.fire('Error', `Error: ${error.message}`, 'error');
            }
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        const { nombre, descripcion, precio, cantidad_disponible, categoria_id } = newProduct;

        // Validar campos obligatorios
        if (!nombre || !descripcion || !precio || !cantidad_disponible || !categoria_id) {
            Swal.fire('Error', 'Todos los campos son requeridos.', 'error');
            return;
        }

        try {
            await axios.post('api/producto/crear-producto', {
                nombre, descripcion, precio, cantidad_disponible, categoria_id
            });

            Swal.fire('¡Creado!', 'El producto ha sido creado exitosamente.', 'success');

            await logAction('Productos', 'Crear', `Creación del producto ${nombre}`, localStorage.getItem('userId'));
            fetchProducts();
            setNewProduct({ nombre: '', descripcion: '', precio: '', cantidad_disponible: '', categoria_id: '' });
            setShowModal(false);
        } catch (error) {
            if (error.response) {
                Swal.fire('Error', `Error ${error.response.status}: ${error.response.data.message || 'No se pudo crear el usuario.'}`, 'error');
            } else if (error.request) {
                Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
            } else {
                Swal.fire('Error', `Error: ${error.message}`, 'error');
            }
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "precio") {
            const numericValue = value.replace(/[^0-9]/g, "");

            if (!isNaN(numericValue) && numericValue !== "") {
                const paddedValue = numericValue.padStart(0, "0");

                const integerPart = paddedValue.slice(0, -2);
                const decimalPart = paddedValue.slice(-2);

                const formattedValue = `${integerPart}.${decimalPart}`;

                if (selectedProduct) {
                    setSelectedProduct((prev) => ({
                        ...prev,
                        [name]: formattedValue,
                    }));
                } else {
                    setNewProduct((prev) => ({
                        ...prev,
                        [name]: formattedValue,
                    }));
                }
            } else {
                if (selectedProduct) {
                    setSelectedProduct((prev) => ({
                        ...prev,
                        [name]: "",
                    }));
                } else {
                    setNewProduct((prev) => ({
                        ...prev,
                        [name]: "",
                    }));
                }
            }
        } else {
            if (selectedProduct) {
                setSelectedProduct((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            } else {
                setNewProduct((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        }
    };
    const descripciones = [
        "Snacks",
        "Bebidas",
        "Limpieza",
        "Viveres"

    ];
    const handleDelete = (userId) => {
        const product = products.find(p => p.id === userId);

        if (!product) {
            Swal.fire('Error', 'No se encontró el producto.', 'error');
            return;
        }

        Swal.fire({
            title: '¿Estás seguro?',
            text: `¡No podrás revertir la eliminación de "${product.nombre}"!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then((result) => {
            if (result.isConfirmed) {
                deleteProduct(userId, product.nombre);
            }
        });
    };


    const deleteProduct = async (userId, productName) => {
        try {
            await axios.delete(`api/producto/eliminar-producto/${userId}`);

            Swal.fire('¡Eliminado!', `El producto "${productName}" ha sido eliminado.`, 'success');

            await logAction('Inventario', 'Eliminar Producto', `Se eliminó el producto "${productName}"`, localStorage.getItem('userId')); // Cambia el 3 por el ID del usuario que realiza la acción

            // Actualizar la lista de productos
            fetchProducts();
        } catch (error) {
            if (error.response) {
                Swal.fire('Error', `Error ${error.response.status}: ${error.response.data.message || 'No se pudo eliminar el producto.'}`, 'error');
            } else if (error.request) {
                Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
            } else {
                Swal.fire('Error', `Error: ${error.message}`, 'error');
            }
        }
    };

    const logAction = async (modulo, accion, detalle, usuario_id) => {
        try {
            await axios.post('/api/bitacora/crear-bitacora', {
                modulo,
                accion,
                detalle,
                usuario_id
            });
            console.log('Bitácora creada exitosamente');
        } catch (error) {
            console.error('Error al enviar la bitácora:', error);
        }
    };
    const exportToExcel = () => {
        if (filteredProducts.length === 0) {
            Swal.fire('Aviso', 'No hay datos para exportar.', 'info');
            return;
        }

        const headers = [
            "Producto",
            "Categoría",
            "Precio ($)",
            "Stock Disponible",
            "Sección",
            "Fecha de Creación"
        ];

        const dataToExport = filteredProducts.map(product => [
            product.nombre,
            product.descripcion,
            `$${parseFloat(product.precio).toFixed(2)}`,
            product.cantidad_disponible,
            categoryMap[product.categoria_id] || "Categoría no definida",
            formatDate(product.fecha_creacion)
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataToExport]);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Productos");

        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        saveAs(data, "Inventario.xlsx");

        Swal.fire('Éxito', 'Archivo Excel generado correctamente.', 'success');
    };
    return (
        <div className="inventory-layout">
            {/* Contenedor principal */}
            <div className="inventory-sidebar">
                <AdminSideMenu />
            </div>
            <div className="inventory-main">
                <Navbar onSelect={setSection} />
                <div className="inventory-content">
                    {section === 'productos' && (
                        <div className="header-inventory">
                            <Card className="mb-4">
                                <Card.Body>
                                    <Row className="align-items-center">
                                        <Col>
                                            <h1 className="staff-title text-center my-4 text-primary fs-2 fw-bold">Productos Pollos A La Brasa Del Valle</h1>
                                        </Col>
                                        <Col className="text-end">
                                            <Button variant="primary" className='me-1' onClick={() => setShowModal(true)}>
                                                Crear Producto
                                            </Button>
                                            <Button variant="success" onClick={exportToExcel}>
                                                Exportar Excel
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Row className="mb-4">
                                <Col>
                                    <Card>
                                        <Card.Body>
                                            <Card.Title className="text-secondary">Productos Creados</Card.Title>
                                            <Card.Text className="text-primary fs-4 fw-bold">{products.length}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card>
                                        <Card.Body>
                                            <Card.Title className="text-secondary">Producto Mas Vendido</Card.Title>
                                            <Card.Text className="text-primary fs-4 fw-bold">{mostSoldProduct}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Card className="mb-4">
                                <Card.Body>
                                    <Row>
                                        <Col style={{ position: "relative" }}>
                                            <Form.Control
                                                type="text"
                                                name="search"
                                                placeholder="Buscar Producto..."
                                                style={{ paddingLeft: "2.5rem" }}
                                                value={filters.search}
                                                onChange={handleFilterChange}
                                            />
                                            <FaSearch
                                                style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "20px",
                                                    transform: "translateY(-50%)",
                                                    fontSize: "18px",
                                                    color: "#6c757d",
                                                }}
                                            />
                                        </Col>

                                        <Col>
                                            <Form.Select
                                                name="category"
                                                value={filters.category}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">Sección</option>
                                                <option value="1">Snacks</option>
                                                <option value="2">Bebidas</option>
                                                <option value="3">Limpieza</option>
                                                <option value="4">Viveres</option>
                                            </Form.Select>
                                        </Col>
                                        <Col>
                                            <Form.Select
                                                name="description"
                                                value={filters.description}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">Categoria</option>
                                                <option value="Viveres Bebidas">Viveres Bebidas</option>
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Categoria</th>
                                                    <th>Precio</th>
                                                    <th>Cantidad Disponible</th>
                                                    <th>Sección</th>
                                                    <th>Fecha de Creacion</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentProducts.map(product => (
                                                    <tr key={product.id}>
                                                        <td>{product.nombre}</td>
                                                        <td>{product.descripcion}</td>
                                                        <td>{product.precio}</td>
                                                        <td>{product.cantidad_disponible}</td>
                                                        <td>{categoryMap[product.categoria_id] || "Categoría no definida"}</td>
                                                        <td>{formatDate(product.fecha_creacion)}</td>
                                                        <td>
                                                            <Button variant="warning" size="sm" onClick={() => handleEdit(product)}>
                                                                Editar
                                                            </Button>
                                                            <Button variant="danger" size="sm" className="ms-1" onClick={() => handleDelete(product.id)}>Eliminar</Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination />
                                </Card.Body>
                            </Card>

                            <Modal show={showModal} onHide={handleCloseModal}>
                                <Modal.Header closeButton>
                                    <Modal.Title>
                                        {selectedProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                                    </Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <Form onSubmit={selectedProduct ? handleSaveChanges : handleCreateProduct}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nombre del Producto</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="nombre"
                                                value={selectedProduct ? selectedProduct.nombre : newProduct.nombre}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Categoria</Form.Label>
                                            <Form.Select
                                                name="descripcion"
                                                value={selectedProduct ? selectedProduct.descripcion : newProduct.descripcion}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Seleccione una categoria</option>
                                                {descripciones.map((desc, index) => (
                                                    <option key={index} value={desc}>
                                                        {desc}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Precio ($)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="precio"
                                                value={selectedProduct ? selectedProduct.precio : newProduct.precio}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Stock Disponible</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="cantidad_disponible"
                                                value={selectedProduct ? selectedProduct.cantidad_disponible : newProduct.cantidad_disponible}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Sección</Form.Label>
                                            <Form.Select
                                                name="categoria_id"
                                                value={selectedProduct ? selectedProduct.categoria_id : newProduct.categoria_id}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Seleccione sección</option>
                                                <option value="1">Snacks</option>
                                                <option value="2">Bebidas</option>
                                                <option value="3">Limpieza</option>
                                                <option value="4">Viveres</option>
                                            </Form.Select>
                                        </Form.Group>

                                        <div className="d-grid gap-2 mt-4">
                                            <Button variant="primary" type="submit">
                                                {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Modal.Body>
                            </Modal>

                        </div>
                    )}

                    {section === 'inventarios' && <h1>Inventario</h1>}
                </div>
            </div>
        </div>
    );
};

export default Inventory;