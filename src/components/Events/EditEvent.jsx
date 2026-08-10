import React, { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, database } from "../../firebase/firebaseConfig";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiClock,
  FiExternalLink,
  FiImage,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiShield,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  buildEventUrl,
  createDefaultEmailBranding,
  createEmptyMerchItem,
  createEmptyTicket,
  EVENT_CATEGORIES,
  getEventUrlDisplayValue,
  normalizeEmailBranding,
  normalizeMerchItem,
  normalizeTicket,
  TICKETING_POLICY_ITEMS,
} from "./eventEditorConfig";
import { uploadEventImage } from "./uploadEventImage";

const EditEvent = () => {
  const { eventId } = useParams();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }

      try {
        const userSnapshot = await get(ref(database, `users/${user.uid}`));
        const userInfo = userSnapshot.val();
        const currentRole = userInfo?.role || "";
        setUserRole(currentRole);

        const eventSnapshot = await get(ref(database, `events/${eventId}`));
        const event = eventSnapshot.val();

        if (!event) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        const isOwner = event.createdBy === user.email;
        const isAdmin = currentRole === "admin";

        if (!isOwner && !isAdmin) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setEventData({
          ...event,
          dateUnknown: event.date === "TBA",
          maxPerUser: event.maxPerUser ?? event.maxPurchaseLimit ?? 1,
          tickets: Array.isArray(event.tickets) ? event.tickets.map(normalizeTicket) : [],
          merch: Array.isArray(event.merch) ? event.merch.map(normalizeMerchItem) : [],
          eventUrl: event.eventUrl || "",
          emailBranding: normalizeEmailBranding(event.emailBranding || createDefaultEmailBranding()),
        });
      } catch (fetchError) {
        console.error(fetchError);
        toast.error("Unable to load this event right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, user]);

  if (!user || loading) {
    return <LoadingSpinner message="Preparing event editor..." />;
  }

  if (unauthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  const totalTicketTypes = eventData.tickets.length;
  const totalPerks = eventData.tickets.reduce(
    (count, ticket) => count + (ticket.perks?.filter((perk) => perk.trim()).length || 0),
    0
  );
  const totalMerchItems = eventData.merch.filter((item) => item.name.trim()).length;
  const finalEventUrl = buildEventUrl(getEventUrlDisplayValue(eventData.eventUrl));

  const updateField = (name, value) => {
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    updateField(name, value);
  };

  const handleDateToggle = (checked) => {
    setEventData((prev) => ({
      ...prev,
      dateUnknown: checked,
      date: checked ? "TBA" : "",
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setUploadingTarget("event-image");

    try {
      const imageUrl = await uploadEventImage(file);
      setEventData((prev) => ({ ...prev, image: imageUrl }));
      toast.success("Image uploaded successfully!");
    } catch (uploadError) {
      console.error(uploadError);
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleMerchImageUpload = async (index, event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const target = `merch-${index}`;
    setUploadingTarget(target);

    try {
      const imageUrl = await uploadEventImage(file);
      setEventData((prev) => {
        const updatedMerch = [...prev.merch];
        updatedMerch[index] = {
          ...updatedMerch[index],
          image: imageUrl,
        };

        return { ...prev, merch: updatedMerch };
      });
      toast.success("Merch image uploaded.");
    } catch (uploadError) {
      console.error(uploadError);
      toast.error("Merch image upload failed. Please try again.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleTicketChange = (index, field, value) => {
    setEventData((prev) => {
      const updatedTickets = [...prev.tickets];
      updatedTickets[index] = {
        ...updatedTickets[index],
        [field]: value,
      };

      return { ...prev, tickets: updatedTickets };
    });
  };

  const handleAddTicket = () => {
    setEventData((prev) => ({
      ...prev,
      tickets: [...prev.tickets, createEmptyTicket()],
    }));
  };

  const handleRemoveTicket = (index) => {
    setEventData((prev) => ({
      ...prev,
      tickets: prev.tickets.filter((_, ticketIndex) => ticketIndex !== index),
    }));
  };

  const handlePerkChange = (ticketIndex, perkIndex, value) => {
    setEventData((prev) => {
      const updatedTickets = [...prev.tickets];
      updatedTickets[ticketIndex] = {
        ...updatedTickets[ticketIndex],
        perks: [...updatedTickets[ticketIndex].perks],
      };
      updatedTickets[ticketIndex].perks[perkIndex] = value;

      return { ...prev, tickets: updatedTickets };
    });
  };

  const handleAddPerk = (ticketIndex) => {
    setEventData((prev) => {
      const updatedTickets = [...prev.tickets];
      updatedTickets[ticketIndex] = {
        ...updatedTickets[ticketIndex],
        perks: [...updatedTickets[ticketIndex].perks, ""],
      };

      return { ...prev, tickets: updatedTickets };
    });
  };

  const handleRemovePerk = (ticketIndex, perkIndex) => {
    setEventData((prev) => {
      const updatedTickets = [...prev.tickets];
      updatedTickets[ticketIndex] = {
        ...updatedTickets[ticketIndex],
        perks: updatedTickets[ticketIndex].perks.filter((_, currentPerkIndex) => currentPerkIndex !== perkIndex),
      };

      return { ...prev, tickets: updatedTickets };
    });
  };

  const handleMerchChange = (index, field, value) => {
    setEventData((prev) => {
      const updatedMerch = [...prev.merch];
      updatedMerch[index] = {
        ...updatedMerch[index],
        [field]: value,
      };

      return { ...prev, merch: updatedMerch };
    });
  };

  const handleBrandingChange = (field, value) => {
    setEventData((prev) => ({
      ...prev,
      emailBranding: {
        ...prev.emailBranding,
        [field]: value,
      },
    }));
  };

  const handleAddMerch = () => {
    setEventData((prev) => ({
      ...prev,
      merch: [...prev.merch, createEmptyMerchItem()],
    }));
  };

  const handleRemoveMerch = (index) => {
    setEventData((prev) => ({
      ...prev,
      merch: prev.merch.filter((_, merchIndex) => merchIndex !== index),
    }));
  };

  const normalizedTickets = eventData.tickets.map((ticket) => ({
    ...ticket,
    price: ticket.price === "" ? "" : Number(ticket.price || 0),
    limit: ticket.limit === "" ? "" : Number(ticket.limit || 0),
    perks: ticket.perks.filter((perk) => perk.trim()),
  }));

  const normalizedMerch = eventData.merch
    .filter((item) => item.name.trim())
    .map((item) => ({
      ...item,
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
    }));
  const normalizedBranding = normalizeEmailBranding(eventData.emailBranding);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const maxPerUser = Number(eventData.maxPerUser || 1);
      const eventRef = ref(database, `events/${eventId}`);

        await update(eventRef, {
          ...eventData,
          date: eventData.dateUnknown ? "TBA" : eventData.date,
          maxPerUser,
          maxPurchaseLimit: maxPerUser,
          eventUrl: finalEventUrl,
          tickets: normalizedTickets,
          merch: normalizedMerch,
          emailBranding: normalizedBranding,
          hostEmail: eventData.hostEmail || user?.email || "Unknown",
          hostUid: eventData.hostUid || user?.uid || "",
        });

      toast.success("Event updated successfully!");

      if (userRole === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/host/dashboard");
      }
    } catch (updateError) {
      toast.error(`Failed to update event: ${updateError.message}`);
    }
  };

  return (
    <div className="event-editor-page">
      <section className="event-editor-shell">
        <div className="event-editor-hero">
          <div className="event-editor-hero-copy">
            <span className="event-editor-kicker">Event management</span>
            <h1>Refine your event page</h1>
            <p>
              Update tickets, merch, timing, and imagery from one premium editing surface.
            </p>
          </div>

          <div className="event-editor-hero-stats">
            <div className="event-editor-stat">
              <strong>{totalTicketTypes}</strong>
              <span>Ticket type{totalTicketTypes === 1 ? "" : "s"}</span>
            </div>
            <div className="event-editor-stat">
              <strong>{totalPerks}</strong>
              <span>Perk{totalPerks === 1 ? "" : "s"}</span>
            </div>
            <div className="event-editor-stat">
              <strong>{totalMerchItems}</strong>
              <span>Merch item{totalMerchItems === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>

        <form className="event-editor-form" onSubmit={handleSubmit}>
          <div className="event-editor-layout">
            <div className="event-editor-main">
              <section className="event-editor-card">
                <div className="event-editor-card-head">
                  <div>
                    <span className="event-editor-section-chip">
                      <FiCalendar aria-hidden="true" />
                      Event basics
                    </span>
                    <h2>Refresh the essentials</h2>
                    <p>Keep your event details clean, clear, and conversion-ready.</p>
                  </div>
                </div>

                <div className="event-editor-fields event-editor-fields-two">
                  <label className="event-editor-field event-editor-field-full">
                    <span>Event Title</span>
                    <input
                      name="title"
                      value={eventData.title || ""}
                      onChange={handleChange}
                      placeholder="Event title"
                      required
                    />
                  </label>

                  <label className="event-editor-field event-editor-field-full">
                    <span>Event Description</span>
                    <textarea
                      name="description"
                      value={eventData.description || ""}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Event description"
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Event Date</span>
                    <input
                      name="date"
                      type="date"
                      value={eventData.dateUnknown ? "" : eventData.date || ""}
                      onChange={handleChange}
                      disabled={eventData.dateUnknown}
                      required={!eventData.dateUnknown}
                    />
                  </label>

                  <label className="event-editor-toggle">
                    <input
                      type="checkbox"
                      checked={eventData.dateUnknown}
                      onChange={(event) => handleDateToggle(event.target.checked)}
                    />
                    <span>Date to be announced</span>
                  </label>

                  <label className="event-editor-field">
                    <span>Start Time</span>
                    <input
                      name="startTime"
                      type="time"
                      value={eventData.startTime || ""}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>End Time</span>
                    <input
                      name="endTime"
                      type="time"
                      value={eventData.endTime || ""}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Location</span>
                    <input
                      name="location"
                      value={eventData.location || ""}
                      onChange={handleChange}
                      placeholder="Location"
                      required
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Event Category</span>
                    <select name="category" value={eventData.category || ""} onChange={handleChange} required>
                      <option value="">Select category</option>
                      {EVENT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="event-editor-field">
                    <span>Max tickets per user</span>
                    <input
                      name="maxPerUser"
                      type="number"
                      min="1"
                      value={eventData.maxPerUser || 1}
                      onChange={handleChange}
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Custom Event URL</span>
                    <div className="event-editor-url-input">
                      <span>ekotixx.com/</span>
                      <input
                        name="eventUrl"
                        value={getEventUrlDisplayValue(eventData.eventUrl)}
                        onChange={(event) => updateField("eventUrl", buildEventUrl(event.target.value))}
                        placeholder="your-event"
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="event-editor-card">
                <div className="event-editor-card-head">
                  <div>
                    <span className="event-editor-section-chip">
                      <FiTag aria-hidden="true" />
                      Ticketing
                    </span>
                    <h2>Edit ticket tiers</h2>
                    <p>Adjust prices, limits, and perks without losing the structure you already built.</p>
                  </div>
                  <button type="button" className="event-editor-secondary-btn" onClick={handleAddTicket}>
                    <FiPlus aria-hidden="true" />
                    Add ticket type
                  </button>
                </div>

                <div className="event-editor-stack">
                  {eventData.tickets.map((ticket, index) => (
                    <div key={`${ticket.type}-${index}`} className="event-editor-nested-card">
                      <div className="event-editor-nested-head">
                        <h3>Ticket Tier {index + 1}</h3>
                        {eventData.tickets.length > 1 && (
                          <button
                            type="button"
                            className="event-editor-danger-btn"
                            onClick={() => handleRemoveTicket(index)}
                          >
                            <FiTrash2 aria-hidden="true" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="event-editor-fields event-editor-fields-three">
                        <label className="event-editor-field">
                          <span>Type</span>
                          <input
                            value={ticket.type || ""}
                            onChange={(event) => handleTicketChange(index, "type", event.target.value)}
                            placeholder="Regular"
                          />
                        </label>

                        <label className="event-editor-field">
                          <span>Price</span>
                          <input
                            type="number"
                            min="0"
                            value={ticket.price || ""}
                            onChange={(event) => handleTicketChange(index, "price", event.target.value)}
                            placeholder="0"
                          />
                        </label>

                        <label className="event-editor-field">
                          <span>Limit</span>
                          <input
                            type="number"
                            min="0"
                            value={ticket.limit || ""}
                            onChange={(event) => handleTicketChange(index, "limit", event.target.value)}
                            placeholder="Unlimited"
                          />
                        </label>
                      </div>

                      <div className="event-editor-perks">
                        <div className="event-editor-inline-head">
                          <h4>Perks</h4>
                          <button
                            type="button"
                            className="event-editor-text-btn"
                            onClick={() => handleAddPerk(index)}
                          >
                            <FiPlus aria-hidden="true" />
                            Add perk
                          </button>
                        </div>

                        {ticket.perks.length === 0 ? (
                          <p className="event-editor-muted">No perks added yet for this ticket tier.</p>
                        ) : (
                          <div className="event-editor-stack">
                            {ticket.perks.map((perk, perkIndex) => (
                              <div key={`${index}-${perkIndex}`} className="event-editor-inline-row">
                                <input
                                  value={perk}
                                  onChange={(event) => handlePerkChange(index, perkIndex, event.target.value)}
                                  placeholder="Complimentary drink"
                                />
                                <button
                                  type="button"
                                  className="event-editor-icon-btn"
                                  onClick={() => handleRemovePerk(index, perkIndex)}
                                  aria-label={`Remove perk ${perkIndex + 1}`}
                                >
                                  <FiTrash2 aria-hidden="true" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="event-editor-card">
                <div className="event-editor-card-head">
                  <div>
                    <span className="event-editor-section-chip">
                      <FiPackage aria-hidden="true" />
                      Merchandise
                    </span>
                    <h2>Update merch offers</h2>
                    <p>Keep your attached products aligned with your event and current stock.</p>
                  </div>
                  <button type="button" className="event-editor-secondary-btn" onClick={handleAddMerch}>
                    <FiPlus aria-hidden="true" />
                    Add merch item
                  </button>
                </div>

                {(eventData.merch.length === 0) ? (
                  <div className="event-editor-empty">
                    <p>No merch items yet. Add one if you want to sell extras alongside tickets.</p>
                  </div>
                ) : (
                  <div className="event-editor-stack">
                    {eventData.merch.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="event-editor-nested-card">
                        <div className="event-editor-nested-head">
                          <h3>Merch Item {index + 1}</h3>
                          <button
                            type="button"
                            className="event-editor-danger-btn"
                            onClick={() => handleRemoveMerch(index)}
                          >
                            <FiTrash2 aria-hidden="true" />
                            Remove
                          </button>
                        </div>

                        <div className="event-editor-fields event-editor-fields-two">
                          <label className="event-editor-field">
                            <span>Name</span>
                            <input
                              value={item.name || ""}
                              onChange={(event) => handleMerchChange(index, "name", event.target.value)}
                              placeholder="Item name"
                            />
                          </label>

                          <label className="event-editor-field">
                            <span>Price</span>
                            <input
                              type="number"
                              min="0"
                              value={item.price || ""}
                              onChange={(event) => handleMerchChange(index, "price", event.target.value)}
                              placeholder="0"
                            />
                          </label>

                          <label className="event-editor-field">
                            <span>Stock</span>
                            <input
                              type="number"
                              min="0"
                              value={item.stock || ""}
                              onChange={(event) => handleMerchChange(index, "stock", event.target.value)}
                              placeholder="0"
                            />
                          </label>

                          <div className="event-editor-field">
                            <span>Merch Image</span>
                            <label className="event-editor-upload event-editor-upload-compact">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleMerchImageUpload(index, event)}
                                disabled={uploadingTarget === `merch-${index}`}
                              />
                              <span>
                                {uploadingTarget === `merch-${index}` ? "Uploading merch image..." : "Upload merch image"}
                              </span>
                              <small>Choose an image from your device.</small>
                            </label>
                            {item.image ? (
                              <div className="event-editor-merch-preview">
                                <img src={item.image} alt={item.name || `Merch item ${index + 1}`} />
                              </div>
                            ) : null}
                          </div>

                          <label className="event-editor-field event-editor-field-full">
                            <span>Description</span>
                            <textarea
                              rows={3}
                              value={item.description || ""}
                              onChange={(event) => handleMerchChange(index, "description", event.target.value)}
                              placeholder="Short merch note"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="event-editor-aside">
              <section className="event-editor-card event-editor-card-sticky">
                <div className="event-editor-card-head">
                  <div>
                    <span className="event-editor-section-chip">
                      <FiImage aria-hidden="true" />
                      Event cover
                    </span>
                    <h2>Update visuals</h2>
                  </div>
                </div>

                <label className="event-editor-upload">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingTarget === "event-image"} />
                  <span>{uploadingTarget === "event-image" ? "Uploading image..." : "Upload a new image"}</span>
                  <small>Swap in a new hero asset when your campaign needs a refresh.</small>
                </label>

                {eventData.image ? (
                  <div className="event-editor-image-preview">
                    <img src={eventData.image} alt="Current event" />
                  </div>
                ) : (
                  <div className="event-editor-image-placeholder">
                    <FiImage aria-hidden="true" />
                    <p>No event image uploaded yet.</p>
                  </div>
                )}

                <div className="event-editor-summary-list">
                  <div>
                    <span>
                      <FiMapPin aria-hidden="true" />
                      Location
                    </span>
                    <strong>{eventData.location || "Add a venue"}</strong>
                  </div>
                  <div>
                    <span>
                      <FiClock aria-hidden="true" />
                      Schedule
                    </span>
                    <strong>
                      {eventData.dateUnknown ? "Date TBA" : eventData.date || "Pick a date"}
                      {eventData.startTime ? ` • ${eventData.startTime}` : ""}
                    </strong>
                  </div>
                  <div>
                    <span>
                      <FiExternalLink aria-hidden="true" />
                      Event URL
                    </span>
                    <strong>{finalEventUrl || "Auto-generated if empty"}</strong>
                  </div>
                  <div>
                    <span>
                      <FiShield aria-hidden="true" />
                      Scanner code
                    </span>
                    <strong>{eventData.scannerCode || "Generated automatically"}</strong>
                  </div>
                </div>
              </section>

              <section className="event-editor-card">
                <div className="event-editor-card-head">
                  <div>
                    <span className="event-editor-section-chip">
                      <FiShield aria-hidden="true" />
                      Reminder
                    </span>
                    <h2>Ticketing policy</h2>
                  </div>
                </div>

                <ul className="event-editor-policy-list">
                  {TICKETING_POLICY_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="event-editor-card">
                <div className="event-editor-card-head">
                  <div>
                    <span className="event-editor-section-chip">
                      <FiShield aria-hidden="true" />
                      Email branding
                    </span>
                    <h2>Receipt branding</h2>
                    <p>Adjust the email identity attached to this event’s ticket receipts.</p>
                  </div>
                </div>

                <div className="event-editor-fields event-editor-fields-two">
                  <label className="event-editor-field">
                    <span>Brand name</span>
                    <input
                      value={eventData.emailBranding?.brandName || ""}
                      onChange={(event) => handleBrandingChange("brandName", event.target.value)}
                      placeholder="Ekotix Presents"
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Support email</span>
                    <input
                      type="email"
                      value={eventData.emailBranding?.supportEmail || ""}
                      onChange={(event) => handleBrandingChange("supportEmail", event.target.value)}
                      placeholder="support@example.com"
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Logo URL</span>
                    <input
                      value={eventData.emailBranding?.logoUrl || ""}
                      onChange={(event) => handleBrandingChange("logoUrl", event.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Footer note</span>
                    <input
                      value={eventData.emailBranding?.footerNote || ""}
                      onChange={(event) => handleBrandingChange("footerNote", event.target.value)}
                      placeholder="Thanks for your support."
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Primary color</span>
                    <input
                      type="color"
                      value={eventData.emailBranding?.primaryColor || "#10612B"}
                      onChange={(event) => handleBrandingChange("primaryColor", event.target.value)}
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Accent color</span>
                    <input
                      type="color"
                      value={eventData.emailBranding?.accentColor || "#1F7A47"}
                      onChange={(event) => handleBrandingChange("accentColor", event.target.value)}
                    />
                  </label>
                </div>
              </section>
            </aside>
          </div>

          <div className="event-editor-actions">
            <button type="button" className="event-editor-secondary-btn" onClick={() => setShowPreview(true)}>
              Preview
            </button>
            <button type="submit" className="event-editor-primary-btn" disabled={uploadingTarget !== null}>
              {uploadingTarget !== null ? "Please wait..." : "Update Event"}
            </button>
          </div>
        </form>
      </section>

      {showPreview && (
        <div className="event-preview-modal" onClick={() => setShowPreview(false)}>
          <div className="event-preview-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="event-preview-head">
              <div>
                <span className="event-editor-kicker">Live preview</span>
                <h2>{eventData.title || "Untitled event"}</h2>
              </div>
              <button
                type="button"
                className="event-editor-icon-btn"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            {eventData.image ? (
              <div className="event-preview-banner">
                <img src={eventData.image} alt="Event preview" />
              </div>
            ) : null}

            <div className="event-preview-grid">
              <div>
                <h3>Overview</h3>
                <p>{eventData.description || "No event description added yet."}</p>
                <ul className="event-preview-meta">
                  <li>{eventData.dateUnknown ? "Date TBA" : eventData.date || "No date selected"}</li>
                  <li>{eventData.startTime || "No start time"} - {eventData.endTime || "No end time"}</li>
                  <li>{eventData.location || "No location yet"}</li>
                  <li>{eventData.category || "No category yet"}</li>
                </ul>
              </div>

              <div>
                <h3>Ticket tiers</h3>
                <div className="event-preview-stack">
                  {normalizedTickets.map((ticket, index) => (
                    <div key={`${ticket.type}-${index}`} className="event-preview-pill">
                      <strong>{ticket.type || `Tier ${index + 1}`}</strong>
                      <span>{ticket.price === "" ? "Free / unset" : `NGN ${Number(ticket.price).toLocaleString()}`}</span>
                      {ticket.perks.length > 0 ? <small>{ticket.perks.join(", ")}</small> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {normalizedMerch.length > 0 ? (
              <div className="event-preview-merch">
                <h3>Merchandise</h3>
                <div className="event-preview-stack">
                  {normalizedMerch.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="event-preview-pill">
                      <strong>{item.name}</strong>
                      <span>NGN {Number(item.price || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="event-preview-actions">
              <button type="button" className="event-editor-secondary-btn" onClick={() => setShowPreview(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEvent;
