import { useEffect, useState } from "react";
import api from "../services/api";

function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/contact/admin");

      setMessages(response.data?.messages || []);
    } catch (error) {
      console.error("Failed to load contact messages:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to load contact messages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const openMessage = async (message) => {
    setSelectedMessage(message);

    if (message.status === "new") {
      try {
        await api.put(`/contact/admin/${message.id}/status`, {
          status: "read",
        });

        setMessages((current) =>
          current.map((item) =>
            item.id === message.id
              ? { ...item, status: "read" }
              : item
          )
        );
      } catch (error) {
        console.error("Failed to update message status:", error);
      }
    }
  };

  const updateStatus = async (messageId, status) => {
    try {
      await api.put(
        `/contact/admin/${messageId}/status`,
        { status }
      );

      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? { ...item, status }
            : item
        )
      );

      setSelectedMessage((current) =>
        current?.id === messageId
          ? { ...current, status }
          : current
      );
    } catch (error) {
      console.error("Failed to update status:", error);

      alert(
        error.response?.data?.detail ||
          "Unable to update message status."
      );
    }
  };

  const deleteMessage = async (messageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/contact/admin/${messageId}`);

      setMessages((current) =>
        current.filter((item) => item.id !== messageId)
      );

      setSelectedMessage(null);
    } catch (error) {
      console.error("Failed to delete message:", error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete message."
      );
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="admin-contact-page">

      <div className="admin-page-header">
        <div>
          <span className="admin-page-label">
            CUSTOMER SUPPORT
          </span>

          <h1>Contact Messages</h1>

          <p>
            View and manage messages submitted through
            your website contact form.
          </p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadMessages}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-empty-state">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">
            ✉
          </div>

          <h3>No contact messages yet</h3>

          <p>
            Messages submitted through your Contact page
            will appear here.
          </p>
        </div>
      ) : (
        <div className="admin-contact-layout">

          {/* MESSAGE LIST */}
          <div className="admin-contact-list">

            <div className="admin-contact-list-header">
              <strong>
                Messages ({messages.length})
              </strong>
            </div>

            {messages.map((message) => (
              <button
                key={message.id}
                className={`admin-message-item ${
                  selectedMessage?.id === message.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => openMessage(message)}
              >

                <div className="admin-message-top">

                  <strong>
                    {message.name}
                  </strong>

                  <span
                    className={`message-status ${message.status}`}
                  >
                    {message.status}
                  </span>

                </div>

                <div className="admin-message-subject">
                  {message.subject}
                </div>

                <div className="admin-message-preview">
                  {message.message}
                </div>

                <div className="admin-message-date">
                  {formatDate(message.created_at)}
                </div>

              </button>
            ))}

          </div>

          {/* MESSAGE DETAILS */}
          <div className="admin-contact-details">

            {!selectedMessage ? (
              <div className="admin-select-message">
                <div className="admin-empty-icon">
                  ✉
                </div>

                <h3>Select a message</h3>

                <p>
                  Choose a message from the list to
                  view its complete details.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-detail-header">

                  <div>
                    <span className="admin-page-label">
                      MESSAGE DETAILS
                    </span>

                    <h2>
                      {selectedMessage.subject}
                    </h2>
                  </div>

                  <button
                    className="admin-close-button"
                    onClick={() => setSelectedMessage(null)}
                  >
                    ×
                  </button>

                </div>

                <div className="admin-customer-details">

                  <div>
                    <span>Name</span>
                    <strong>
                      {selectedMessage.name}
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                    >
                      {selectedMessage.email}
                    </a>
                  </div>

                  <div>
                    <span>Phone</span>

                    {selectedMessage.phone ? (
                      <a
                        href={`tel:${selectedMessage.phone}`}
                      >
                        {selectedMessage.phone}
                      </a>
                    ) : (
                      <strong>Not provided</strong>
                    )}
                  </div>

                  <div>
                    <span>Received</span>
                    <strong>
                      {formatDate(
                        selectedMessage.created_at
                      )}
                    </strong>
                  </div>

                </div>

                <div className="admin-full-message">
                  <span>Message</span>

                  <p>
                    {selectedMessage.message}
                  </p>
                </div>

                <div className="admin-message-actions">

                  <div>
                    <span className="admin-action-label">
                      Status
                    </span>

                    <select
                      value={selectedMessage.status}
                      onChange={(event) =>
                        updateStatus(
                          selectedMessage.id,
                          event.target.value
                        )
                      }
                    >
                      <option value="new">
                        New
                      </option>

                      <option value="read">
                        Read
                      </option>

                      <option value="replied">
                        Replied
                      </option>

                      <option value="closed">
                        Closed
                      </option>
                    </select>
                  </div>

                  <div className="admin-action-buttons">

                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                        selectedMessage.subject
                      )}`}
                      className="admin-reply-button"
                    >
                      ✉ Reply by Email
                    </a>

                    <button
                      className="admin-delete-button"
                      onClick={() =>
                        deleteMessage(
                          selectedMessage.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminContactMessages;