import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiShoppingBag, FiTruck, FiShield } from "react-icons/fi";
import { auth, database } from "../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, get } from "firebase/database";
import { PaystackButton } from "react-paystack";
import { apiUrl } from "../Utils/apiBase";

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

const MerchCheckout = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [userData, setUserData] = useState({ name: "", email: "", phone: "" });
  const [deliveryType, setDeliveryType] = useState("standard");
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    get(ref(database, `events/${eventId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setNotFound(true);
          return;
        }

        const eventData = snapshot.val();
        setEvent({ id: eventId, ...eventData });
        const firstMerch = Array.isArray(eventData.merch) && eventData.merch[0];
        if (firstMerch) setSelectedItemId(firstMerch.id || firstMerch.name);
      })
      .catch((error) => {
        console.error("Merch checkout load error:", error);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!user) return;
    setUserData({
      name: user.displayName || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
    });
  }, [user]);

  const merchItems = useMemo(() => Array.isArray(event?.merch) ? event.merch : [], [event]);
  const selectedItem = merchItems.find((item) => (item.id || item.name) === selectedItemId) || merchItems[0] || {};
  const itemPrice = Number(selectedItem.price || 0);
  const itemStock = Number(selectedItem.stock || 0) || 1;
  const baseAmount = itemPrice * quantity;
  const deliveryFee = deliveryType === "express" ? 3000 : 1500;
  const platformFee = baseAmount > 0 ? 300 : 0;
  const totalAmount = baseAmount + platformFee + deliveryFee;

  const isValidEmail = /\S+@\S+\.\S+/.test(userData.email);
  const canPay =
    !!selectedItemId &&
    userData.name.trim().length >= 2 &&
    isValidEmail &&
    userData.phone.trim().length >= 10 &&
    quantity >= 1 &&
    quantity <= itemStock &&
    totalAmount > 0 &&
    !!PAYSTACK_PUBLIC_KEY &&
    !sending;

  const handlePaymentSuccess = async (response) => {
    setSending(true);

    try {
      const currentUser = auth.currentUser;
      const authToken = currentUser ? await currentUser.getIdToken(true) : "";
      const res = await fetch(apiUrl("/payments/verify"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          reference: response.reference,
          kind: "merch",
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.verified) {
        throw new Error(result?.error || "Payment verification failed.");
      }

      setSuccessMessage("Payment verified. Your merch order is being finalized by the server.");
    } catch (error) {
      console.error("Merch verification error:", error);
      setSuccessMessage("Payment succeeded, but verification is still in progress. Please refresh shortly.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="event-wrap"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-image" /><div className="skeleton skeleton-line" /></div>;
  }

  if (notFound || !event) {
    return (
      <div className="event-wrap">
        <div className="empty-state-card">
          <h2>Event not found</h2>
          <p>This merch checkout page cannot load the event.</p>
          <button className="btn-primary" onClick={() => navigate(-1)}>Return</button>
        </div>
      </div>
    );
  }

  const paystackConfig = {
    email: userData.email,
    amount: totalAmount * 100,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      name: userData.name,
      event_title: event?.title || "",
      host_email: event?.hostEmail || event?.createdBy || "",
      host_uid: event?.hostUid || "",
      phone: userData.phone.trim(),
      base_amount: String(baseAmount),
      platform_fee: String(platformFee),
      delivery_fee: String(deliveryFee),
      delivery_type: deliveryType,
      total_amount: String(totalAmount),
      custom_fields: [
        { display_name: "Merch item", variable_name: "merch_name", value: selectedItem.name },
        { display_name: "Quantity", variable_name: "quantity", value: String(quantity) },
        { display_name: "Event ID", variable_name: "event_id", value: eventId },
        { display_name: "Event Title", variable_name: "event_title", value: event?.title || "" },
        { display_name: "Host Email", variable_name: "host_email", value: event?.hostEmail || event?.createdBy || "" },
        { display_name: "Host UID", variable_name: "host_uid", value: event?.hostUid || "" },
        { display_name: "Phone", variable_name: "phone", value: userData.phone.trim() },
        { display_name: "Base Amount", variable_name: "base_amount", value: String(baseAmount) },
        { display_name: "Platform Fee", variable_name: "platform_fee", value: String(platformFee) },
        { display_name: "Delivery Fee", variable_name: "delivery_fee", value: String(deliveryFee) },
        { display_name: "Delivery Type", variable_name: "delivery_type", value: deliveryType },
        { display_name: "Total Amount", variable_name: "total_amount", value: String(totalAmount) },
      ],
    },
    text: sending ? "Processing..." : "Pay Now",
    onSuccess: handlePaymentSuccess,
    onClose: () => {},
  };

  return (
    <div className="checkout-page">
      <div className="checkout-content">
        <div className="checkout-panel">
          <div className="checkout-heading">
            <div className="checkout-heading-brand">
              <img src="/images/Logo1.jpg" alt="Ekotix logo" className="checkout-brand-logo" />
              <div>
                <p className="kicker">Secure Checkout</p>
                <h1>Buy merch</h1>
              </div>
            </div>
            <button className="btn-copy-link" onClick={() => navigate(`/event/${eventId}`)}>
              <FiArrowLeft style={{ marginRight: 6 }} /> Back to shop
            </button>
          </div>

          <div className="checkout-section">
            <h2>Your items</h2>
            {merchItems.length === 0 ? (
              <p className="host-muted-note">No merch is available for this event.</p>
            ) : (
              <>
                <label>Item</label>
                <select className="select" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                  {merchItems.map((item, index) => (
                    <option key={index} value={item.id || item.name}>
                      {item.name} - ₦{Number(item.price || 0).toLocaleString()}
                    </option>
                  ))}
                </select>

                <div className="checkout-merch-card">
                  <img src={selectedItem.image || "/images/partypic.jpg"} alt={selectedItem.name || "Merch"} />
                  <div>
                    <strong>{selectedItem.name || "Merch item"}</strong>
                    <p>₦{Number(selectedItem.price || 0).toLocaleString()}</p>
                    <p>Stock: {itemStock}</p>
                  </div>
                </div>

                <label>Quantity</label>
                <div className="quantity-row">
                  <button type="button" className="quantity-btn" onClick={() => setQuantity((qty) => Math.max(1, qty - 1))}>-</button>
                  <input className="input qty-input" type="number" value={quantity} min="1" max={itemStock} onChange={(e) => setQuantity(Math.max(1, Math.min(itemStock, Number(e.target.value))))} />
                  <button type="button" className="quantity-btn" onClick={() => setQuantity((qty) => Math.min(itemStock, qty + 1))}>+</button>
                </div>
              </>
            )}
          </div>

          <div className="checkout-section">
            <h2>Delivery details</h2>
            <label>Name</label>
            <input className="input" name="name" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} placeholder="Full name" />
            <label>Email</label>
            <input className="input" name="email" value={userData.email} onChange={(e) => setUserData({ ...userData, email: e.target.value })} placeholder="you@example.com" />
            <label>Phone</label>
            <input className="input" name="phone" value={userData.phone} onChange={(e) => setUserData({ ...userData, phone: e.target.value })} placeholder="+234 800 000 0000" />

            <div className="delivery-options">
              <label>
                <input type="radio" checked={deliveryType === "standard"} onChange={() => setDeliveryType("standard")} />
                Standard delivery (2-4 business days) - ₦1,500
              </label>
              <label>
                <input type="radio" checked={deliveryType === "express"} onChange={() => setDeliveryType("express")} />
                Express delivery (next day) - ₦3,000
              </label>
            </div>
          </div>
        </div>

        <aside className="order-summary-card">
          <div className="order-summary-header">
            <div className="summary-title">
              <span className="summary-icon"><FiShoppingBag /></span>
              <div>
                <h3>Order summary</h3>
                <p>{selectedItem.name || "Merch item"}</p>
              </div>
            </div>
          </div>

          <div className="order-item">
            <span>{selectedItem.name || "Item"} × {quantity}</span>
            <strong>₦{baseAmount.toLocaleString()}</strong>
          </div>
          <div className="order-item">
            <span>Delivery fee</span>
            <strong>₦{deliveryFee.toLocaleString()}</strong>
          </div>
          <div className="order-item">
            <span>Service fee</span>
            <strong>₦{platformFee.toLocaleString()}</strong>
          </div>
          <div className="order-total">
            <span>Total</span>
            <strong>₦{totalAmount.toLocaleString()}</strong>
          </div>

          {successMessage ? (
            <div className="checkout-success-banner">{successMessage}</div>
          ) : PAYSTACK_PUBLIC_KEY ? (
            <PaystackButton {...paystackConfig} className="btn-primary checkout-pay-btn" disabled={!canPay} />
          ) : (
            <div className="notification warning">Paystack public key is not configured.</div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default MerchCheckout;
