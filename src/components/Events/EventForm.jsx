import React, { useMemo, useState } from "react";
import { ref, push } from "firebase/database";
import { database, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
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
import { generateScannerCode } from "./generateScannerCode";
import { uploadEventImage } from "./uploadEventImage";
import {
  buildEventUrl,
  createDefaultTicket,
  createEmptyMerchItem,
  createEmptyTicket,
  EVENT_CATEGORIES,
  getEventUrlDisplayValue,
  TICKETING_POLICY_ITEMS,
} from "./eventEditorConfig";

const EventForm = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    dateUnknown: false,
    startTime: "",
    endTime: "",
    location: "",
    category: "",
    maxPerUser: 1,
    image: "",
    eventUrl: "",
    tickets: [createDefaultTicket()],
    merch: [],
  });

  const totalTicketTypes = formData.tickets.length;
  const totalPerks = formData.tickets.reduce(
    (count, ticket) => count + (ticket.perks?.filter((perk) => perk.trim()).length || 0),
    0
  );
  const totalMerchItems = formData.merch.filter((item) => item.name.trim()).length;
  const finalEventUrl = useMemo(() => buildEventUrl(getEventUrlDisplayValue(formData.eventUrl)), [formData.eventUrl]);

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    updateField(name, value);
  };

  const handleDateToggle = (checked) => {
    setFormData((prev) => ({
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
    setError("");

    try {
      const imageUrl = await uploadEventImage(file);
      setFormData((prev) => ({ ...prev, image: imageUrl }));
      toast.success("Event image uploaded.");
    } catch (uploadError) {
      console.error(uploadError);
      setError("Image upload failed. Please try again.");
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
    setError("");

    try {
      const imageUrl = await uploadEventImage(file);
      setFormData((prev) => {
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
      setError("Merch image upload failed. Please try again.");
      toast.error("Merch image upload failed. Please try again.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleTicketChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedTickets = [...prev.tickets];
      updatedTickets[index] = {
        ...updatedTickets[index],
        [field]: value,
      };

      return { ...prev, tickets: updatedTickets };
    });
  };

  const handleAddTicket = () => {
    setFormData((prev) => ({
      ...prev,
      tickets: [...prev.tickets, createEmptyTicket()],
    }));
  };

  const handleRemoveTicket = (index) => {
    setFormData((prev) => ({
      ...prev,
      tickets: prev.tickets.filter((_, ticketIndex) => ticketIndex !== index),
    }));
  };

  const handlePerkChange = (ticketIndex, perkIndex, value) => {
    setFormData((prev) => {
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
    setFormData((prev) => {
      const updatedTickets = [...prev.tickets];
      updatedTickets[ticketIndex] = {
        ...updatedTickets[ticketIndex],
        perks: [...updatedTickets[ticketIndex].perks, ""],
      };

      return { ...prev, tickets: updatedTickets };
    });
  };

  const handleRemovePerk = (ticketIndex, perkIndex) => {
    setFormData((prev) => {
      const updatedTickets = [...prev.tickets];
      updatedTickets[ticketIndex] = {
        ...updatedTickets[ticketIndex],
        perks: updatedTickets[ticketIndex].perks.filter((_, currentPerkIndex) => currentPerkIndex !== perkIndex),
      };

      return { ...prev, tickets: updatedTickets };
    });
  };

  const handleMerchChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedMerch = [...prev.merch];
      updatedMerch[index] = {
        ...updatedMerch[index],
        [field]: value,
      };

      return { ...prev, merch: updatedMerch };
    });
  };

  const handleAddMerch = () => {
    setFormData((prev) => ({
      ...prev,
      merch: [...prev.merch, createEmptyMerchItem()],
    }));
  };

  const handleRemoveMerch = (index) => {
    setFormData((prev) => ({
      ...prev,
      merch: prev.merch.filter((_, merchIndex) => merchIndex !== index),
    }));
  };

  const normalizedTickets = formData.tickets.map((ticket) => ({
    ...ticket,
    price: ticket.price === "" ? "" : Number(ticket.price || 0),
    limit: ticket.limit === "" ? "" : Number(ticket.limit || 0),
    perks: ticket.perks.filter((perk) => perk.trim()),
  }));

  const normalizedMerch = formData.merch
    .filter((item) => item.name.trim())
    .map((item) => ({
      ...item,
      price: Number(item.price || 0),
      stock: Number(item.stock || 0),
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const maxPerUser = Number(formData.maxPerUser || 1);
      const newEvent = {
        ...formData,
        date: formData.dateUnknown ? "TBA" : formData.date,
        maxPerUser,
        maxPurchaseLimit: maxPerUser,
        eventUrl: finalEventUrl,
        tickets: normalizedTickets,
        merch: normalizedMerch,
        createdBy: user?.email || "Unknown",
        timestamp: Date.now(),
        scannerCode: generateScannerCode(),
      };

      await push(ref(database, "events"), newEvent);
      toast.success("Event created successfully!");

      if (user) {
        const snapshot = await (await import("firebase/database")).get(ref(database, `users/${user.uid}`));
        const role = snapshot.val()?.role;

        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/host/dashboard");
        }
      }
    } catch (submitError) {
      console.error(submitError);
      setError("Something went wrong while saving your event.");
    }
  };

  return (
    <div className="event-editor-page">
      <section className="event-editor-shell">
        <div className="event-editor-hero">
          <div className="event-editor-hero-copy">
            <span className="event-editor-kicker">Host workflow</span>
            <h1>Create a polished event page</h1>
            <p>
              Set the core details, build ticket tiers, and add merch in one premium workspace.
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
                    <h2>Shape the experience</h2>
                    <p>Start with the information attendees need to trust and remember your event.</p>
                  </div>
                </div>

                <div className="event-editor-fields event-editor-fields-two">
                  <label className="event-editor-field event-editor-field-full">
                    <span>Event Title</span>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Summer rooftop party"
                      required
                    />
                  </label>

                  <label className="event-editor-field event-editor-field-full">
                    <span>Event Description</span>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Tell guests what makes this event worth showing up for."
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Event Date</span>
                    <input
                      name="date"
                      type="date"
                      value={formData.dateUnknown ? "" : formData.date}
                      onChange={handleChange}
                      disabled={formData.dateUnknown}
                      required={!formData.dateUnknown}
                    />
                  </label>

                  <label className="event-editor-toggle">
                    <input
                      type="checkbox"
                      checked={formData.dateUnknown}
                      onChange={(event) => handleDateToggle(event.target.checked)}
                    />
                    <span>Date to be announced</span>
                  </label>

                  <label className="event-editor-field">
                    <span>Start Time</span>
                    <input
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>End Time</span>
                    <input
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Location</span>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Victoria Island, Lagos"
                      required
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Event Category</span>
                    <select name="category" value={formData.category} onChange={handleChange} required>
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
                      value={formData.maxPerUser}
                      min="1"
                      onChange={handleChange}
                    />
                  </label>

                  <label className="event-editor-field">
                    <span>Custom Event URL</span>
                    <div className="event-editor-url-input">
                      <span>ekotixx.com/</span>
                      <input
                        name="eventUrl"
                        value={getEventUrlDisplayValue(formData.eventUrl)}
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
                    <h2>Build ticket tiers</h2>
                    <p>Create flexible pricing and include the perks that help each tier stand out.</p>
                  </div>
                  <button type="button" className="event-editor-secondary-btn" onClick={handleAddTicket}>
                    <FiPlus aria-hidden="true" />
                    Add ticket type
                  </button>
                </div>

                <div className="event-editor-stack">
                  {formData.tickets.map((ticket, index) => (
                    <div key={`${ticket.type}-${index}`} className="event-editor-nested-card">
                      <div className="event-editor-nested-head">
                        <h3>Ticket Tier {index + 1}</h3>
                        {formData.tickets.length > 1 && (
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
                            value={ticket.type}
                            onChange={(event) => handleTicketChange(index, "type", event.target.value)}
                            placeholder="VIP"
                          />
                        </label>

                        <label className="event-editor-field">
                          <span>Price</span>
                          <input
                            type="number"
                            min="0"
                            value={ticket.price}
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
                                  placeholder="Front-row seating"
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
                    <h2>Add merch offers</h2>
                    <p>Optional merch lets you attach extra revenue streams directly to your event.</p>
                  </div>
                  <button type="button" className="event-editor-secondary-btn" onClick={handleAddMerch}>
                    <FiPlus aria-hidden="true" />
                    Add merch item
                  </button>
                </div>

                {(formData.merch.length === 0) ? (
                  <div className="event-editor-empty">
                    <p>No merch items yet. Add shirts, caps, or exclusive bundles if you need them.</p>
                  </div>
                ) : (
                  <div className="event-editor-stack">
                    {formData.merch.map((item, index) => (
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
                              value={item.name}
                              onChange={(event) => handleMerchChange(index, "name", event.target.value)}
                              placeholder="Limited edition tee"
                            />
                          </label>

                          <label className="event-editor-field">
                            <span>Price</span>
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(event) => handleMerchChange(index, "price", event.target.value)}
                              placeholder="0"
                            />
                          </label>

                          <label className="event-editor-field">
                            <span>Stock</span>
                            <input
                              type="number"
                              min="0"
                              value={item.stock}
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
                              value={item.description}
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
                      Brand preview
                    </span>
                    <h2>Event cover</h2>
                  </div>
                </div>

                <label className="event-editor-upload">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingTarget === "event-image"} />
                  <span>{uploadingTarget === "event-image" ? "Uploading image..." : "Upload event image"}</span>
                  <small>Use a bold hero image that fits your theme and audience.</small>
                </label>

                {formData.image ? (
                  <div className="event-editor-image-preview">
                    <img src={formData.image} alt="Event preview" />
                  </div>
                ) : (
                  <div className="event-editor-image-placeholder">
                    <FiImage aria-hidden="true" />
                    <p>Your event artwork preview will appear here.</p>
                  </div>
                )}

                <div className="event-editor-summary-list">
                  <div>
                    <span>
                      <FiMapPin aria-hidden="true" />
                      Location
                    </span>
                    <strong>{formData.location || "Add a venue"}</strong>
                  </div>
                  <div>
                    <span>
                      <FiClock aria-hidden="true" />
                      Schedule
                    </span>
                    <strong>
                      {formData.dateUnknown
                        ? "Date TBA"
                        : formData.date || "Pick a date"}
                      {formData.startTime ? ` • ${formData.startTime}` : ""}
                    </strong>
                  </div>
                  <div>
                    <span>
                      <FiExternalLink aria-hidden="true" />
                      Event URL
                    </span>
                    <strong>{finalEventUrl || "Auto-generated if empty"}</strong>
                  </div>
                </div>
              </section>

              <section className="event-editor-card">
                <div className="event-editor-card-head">
                  <div>
                    <span className="event-editor-section-chip">
                      <FiShield aria-hidden="true" />
                      Policy
                    </span>
                    <h2>Ticketing rules</h2>
                  </div>
                </div>

                <p className="event-editor-muted">
                  By creating an event on Ekotix, you agree to the following:
                </p>
                <ul className="event-editor-policy-list">
                  {TICKETING_POLICY_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <label className="event-editor-policy-check">
                  <input
                    type="checkbox"
                    checked={acceptedPolicy}
                    onChange={(event) => setAcceptedPolicy(event.target.checked)}
                  />
                  <span>
                    I have read and agree to the ticketing policy, including the ban on physical ticket sales.
                  </span>
                </label>
              </section>
            </aside>
          </div>

          {error ? <p className="event-editor-error">{error}</p> : null}

          <div className="event-editor-actions">
            <button type="button" className="event-editor-secondary-btn" onClick={() => setShowPreview(true)}>
              Preview
            </button>
            <button
              type="submit"
              className="event-editor-primary-btn"
              disabled={!acceptedPolicy || uploadingTarget !== null}
            >
              {uploadingTarget !== null ? "Please wait..." : "Create Event"}
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
                <h2>{formData.title || "Untitled event"}</h2>
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

            {formData.image ? (
              <div className="event-preview-banner">
                <img src={formData.image} alt="Event preview" />
              </div>
            ) : null}

            <div className="event-preview-grid">
              <div>
                <h3>Overview</h3>
                <p>{formData.description || "No event description added yet."}</p>
                <ul className="event-preview-meta">
                  <li>{formData.dateUnknown ? "Date TBA" : formData.date || "No date selected"}</li>
                  <li>{formData.startTime || "No start time"} - {formData.endTime || "No end time"}</li>
                  <li>{formData.location || "No location yet"}</li>
                  <li>{formData.category || "No category yet"}</li>
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

export default EventForm;
