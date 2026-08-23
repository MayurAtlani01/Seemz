import "./AdminProducts.css";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  X,
  Check,
  AlertCircle,
  Package,
  Layers,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
} from "../../services/productservices";
import imgFallback from "../../assets/images/product1.jpg";

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const MAIN_CATEGORIES = ["Men", "Women"];
const COMMON_SUBCATEGORIES = [
  "Shirts",
  "T-Shirts",
  "Blazers",
  "Suits",
  "Trousers",
  "Pants",
  "Jackets",
  "Coats",
  "Dresses",
  "Knitwear",
  "Accessories",
];

const INITIAL_FORM = {
  name: "",
  brand: "SEEMZ",
  description: "",
  price: "",
  category: "Men",
  subCategory: "Shirts",
  sizes: ["S", "M", "L", "XL"],
  stock: 10,
  images: [],
};

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fileInputRef = useRef(null);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      if (data?.success && Array.isArray(data?.products)) {
        setProducts(data.products);
      } else if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Error loading products for admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      brand: product.brand || "SEEMZ",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "Men",
      subCategory: product.subCategory || "Shirts",
      sizes: Array.isArray(product.sizes) ? product.sizes : ["S", "M", "L"],
      stock: product.stock !== undefined ? product.stock : 10,
      images: Array.isArray(product.images) ? product.images : [],
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setSelectedFiles([]);
    setPreviewUrls([]);
    setFormError("");
    setFormSuccess("");
  };

  // File selection & preview
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // Remove a newly selected file preview
  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing image in edit mode
  const handleRemoveExistingImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Toggle size in form
  const handleToggleSize = (sz) => {
    setFormData((prev) => {
      const exists = prev.sizes.includes(sz);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter((s) => s !== sz) : [...prev.sizes, sz],
      };
    });
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setFormError("Please enter a valid price.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Product description is required.");
      return;
    }

    try {
      setActionLoading(true);
      let finalImages = [...formData.images];

      // 1. Upload new image files if selected
      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        const uploadData = new FormData();
        selectedFiles.forEach((file) => {
          uploadData.append("images", file);
        });

        const uploadRes = await uploadProductImages(uploadData);
        if (uploadRes?.success && Array.isArray(uploadRes.urls)) {
          finalImages = [...finalImages, ...uploadRes.urls];
        } else {
          throw new Error(uploadRes?.message || "Failed to upload images");
        }
        setUploadingImages(false);
      }

      // If no images provided at all, fallback to a default image URL
      if (finalImages.length === 0) {
        finalImages = ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800"];
      }

      const payload = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || "SEEMZ",
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        subCategory: formData.subCategory.trim() || "General",
        sizes: formData.sizes.length > 0 ? formData.sizes : ["Free Size"],
        stock: Number(formData.stock) || 0,
        images: finalImages,
      };

      if (editingProduct) {
        // UPDATE
        const res = await updateProduct(editingProduct._id, payload);
        if (res?.success) {
          setFormSuccess("Product updated successfully!");
          setTimeout(() => {
            handleCloseModal();
            fetchProducts();
          }, 800);
        } else {
          throw new Error(res?.message || "Failed to update product");
        }
      } else {
        // CREATE
        const res = await createProduct(payload);
        if (res?.success) {
          setFormSuccess("Product created successfully!");
          setTimeout(() => {
            handleCloseModal();
            fetchProducts();
          }, 800);
        } else {
          throw new Error(res?.message || "Failed to create product");
        }
      }
    } catch (err) {
      console.error("Save product error:", err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to save product. Check permissions and data.";
      setFormError(serverMsg);
    } finally {
      setActionLoading(false);
      setUploadingImages(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    try {
      setActionLoading(true);
      const res = await deleteProduct(id);
      if (res?.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error("Delete product error:", err);
      alert(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter products for display in table
  const displayedProducts = products.filter((p) => {
    const matchesCat =
      filterCategory === "All" ||
      p.category?.toLowerCase() === filterCategory.toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.subCategory?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `₹${price.toLocaleString("en-IN")}`;
    }
    return price || "₹0";
  };

  return (
    <div className="admin-page">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-badge">SEEMZ ATELIER</span>
          <h1>Product Management</h1>
          <p>Create, update, and manage your luxury product catalog</p>
        </div>

        <button className="admin-add-btn" onClick={handleOpenCreate}>
          <Plus size={18} /> Add New Product
        </button>
      </header>

      {/* Control Bar: Search & Category Filter */}
      <div className="admin-controls-card">
        <div className="admin-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by name, subcategory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-cat-filters">
          {["All", "Men", "Women"].map((cat) => (
            <button
              key={cat}
              className={`admin-filter-pill ${filterCategory === cat ? "active" : ""}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table Area */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-state">
            <Loader2 size={32} className="spin" />
            <p>Loading catalog from MongoDB...</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="admin-empty-state">
            <Package size={48} strokeWidth={1.2} />
            <h3>No products found</h3>
            <p>
              {searchTerm || filterCategory !== "All"
                ? "No products match your search or filter."
                : "You have not added any products yet. Click 'Add New Product' to get started."}
            </p>
            {searchTerm && (
              <button
                className="admin-secondary-btn"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("All");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Piece</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Sizes</th>
                <th>Price</th>
                <th>Stock</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((p) => {
                const img =
                  Array.isArray(p.images) && p.images.length > 0
                    ? p.images[0]
                    : p.image || imgFallback;
                return (
                  <tr key={p._id}>
                    <td>
                      <div className="table-product-cell">
                        <img
                          src={img}
                          alt={p.name}
                          className="table-thumb"
                        />
                        <div>
                          <span className="table-brand">{p.brand || "SEEMZ"}</span>
                          <h4 className="table-title">{p.name}</h4>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-tag">{p.category || "General"}</span>
                    </td>
                    <td>{p.subCategory || "—"}</td>
                    <td>
                      <div className="table-sizes-list">
                        {Array.isArray(p.sizes) && p.sizes.length > 0
                          ? p.sizes.join(", ")
                          : "Free Size"}
                      </div>
                    </td>
                    <td className="table-price">{formatPrice(p.price)}</td>
                    <td>
                      <span
                        className={`stock-badge ${p.stock > 0 ? "in-stock" : "out-stock"}`}
                      >
                        {p.stock > 0 ? `${p.stock} units` : "Out of Stock"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-actions">
                        <button
                          className="action-icon-btn edit"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn delete"
                          onClick={() => setDeleteConfirmId(p._id)}
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <span className="modal-eyebrow">
                  {editingProduct ? "MODIFY PRODUCT" : "NEW PIECE"}
                </span>
                <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="admin-form">
              {formError && (
                <div className="form-alert error">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="form-alert success">
                  <Check size={16} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oversized Structured Blazer"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    placeholder="SEEMZ"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description, fabric composition, silhouette..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="6499"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    {MAIN_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Count *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subcategory</label>
                <div className="subcategory-quick-picks">
                  {COMMON_SUBCATEGORIES.map((sub) => (
                    <button
                      type="button"
                      key={sub}
                      className={`quick-pick-btn ${formData.subCategory === sub ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, subCategory: sub })}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom subcategory"
                  value={formData.subCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subCategory: e.target.value })
                  }
                  style={{ marginTop: "10px" }}
                />
              </div>

              {/* Sizes Multi-Select */}
              <div className="form-group">
                <label>Available Sizes</label>
                <div className="form-sizes-grid">
                  {AVAILABLE_SIZES.map((sz) => (
                    <button
                      type="button"
                      key={sz}
                      className={`form-size-btn ${formData.sizes.includes(sz) ? "active" : ""}`}
                      onClick={() => handleToggleSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Images Uploader */}
              <div className="form-group">
                <label>Product Images (Upload or Managed URLs)</label>

                {/* Existing Images (Edit mode) */}
                {formData.images.length > 0 && (
                  <div className="existing-images-preview">
                    <p className="preview-heading">Current Saved Images:</p>
                    <div className="preview-thumbs-grid">
                      {formData.images.map((imgUrl, i) => (
                        <div key={`exist-${i}`} className="preview-thumb-card">
                          <img src={imgUrl} alt={`Saved ${i}`} />
                          <button
                            type="button"
                            className="remove-thumb-btn"
                            onClick={() => handleRemoveExistingImage(i)}
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Zone */}
                <div
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} />
                  <p>Click to select product photos from your device</p>
                  <span>Supports JPG, PNG, WEBP (Up to 10MB each)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>

                {/* New Selected Files Previews */}
                {previewUrls.length > 0 && (
                  <div className="new-previews-container">
                    <p className="preview-heading">Photos to Upload:</p>
                    <div className="preview-thumbs-grid">
                      {previewUrls.map((preview, i) => (
                        <div key={`new-${i}`} className="preview-thumb-card">
                          <img src={preview} alt={`Upload ${i}`} />
                          <button
                            type="button"
                            className="remove-thumb-btn"
                            onClick={() => handleRemoveSelectedFile(i)}
                            title="Remove photo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      {uploadingImages ? "Uploading Photos..." : "Saving..."}
                    </>
                  ) : editingProduct ? (
                    "Save Changes"
                  ) : (
                    "Publish Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {deleteConfirmId && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal delete-modal">
            <h3>Delete Product?</h3>
            <p>
              Are you sure you want to permanently remove this piece from the
              SEEMZ catalog? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setDeleteConfirmId(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="modal-delete-btn"
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
