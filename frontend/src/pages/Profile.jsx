import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getMyProfile,
  updateMyProfile,
} from "../services/userService";

import "../app.css";


function Profile() {

  const {
    user,
    logout,
  } = useAuth();


  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    id: "",
  });


  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  /* =====================================================
     LOAD PROFILE
  ===================================================== */

  useEffect(() => {

    const loadProfile = async () => {

      try {

        setLoading(true);

        const data = await getMyProfile();

        setProfile(data);

        setFormData({
          name: data.name || "",
          phone: data.phone || "",
        });

      } catch (error) {

        console.error(
          "Failed to load profile:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load profile."
        );

      } finally {

        setLoading(false);

      }
    };


    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }

  }, [user]);


  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };


  /* =====================================================
     EDIT
  ===================================================== */

  const handleEdit = () => {

    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
    });

    setEditing(true);

    setError("");
    setSuccess("");
  };


  /* =====================================================
     CANCEL
  ===================================================== */

  const handleCancel = () => {

    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
    });

    setEditing(false);

    setError("");
    setSuccess("");
  };


  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");


    if (!formData.name.trim()) {

      setError(
        "Please enter your name."
      );

      return;
    }


    try {

      setSaving(true);


      const response =
        await updateMyProfile({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        });


      const updatedUser =
        response.user;


      setProfile(updatedUser);


      setFormData({
        name: updatedUser.name || "",
        phone: updatedUser.phone || "",
      });


      setEditing(false);

      setSuccess(
        "Profile updated successfully."
      );


    } catch (error) {

      console.error(
        "Profile update failed:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to update profile."
      );

    } finally {

      setSaving(false);

    }
  };


  /* =====================================================
     NOT LOGGED IN
  ===================================================== */

  if (!user) {

    return (
      <main className="profile-page">

        <div className="profile-login-card">

          <div className="profile-login-icon">
            👤
          </div>

          <h1>
            Please <span>Login</span>
          </h1>

          <p>
            Login to view and manage your profile.
          </p>

          <Link
            to="/login"
            className="primary-button"
          >
            Login
          </Link>

        </div>

      </main>
    );
  }


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (
      <main className="profile-page">

        <div className="profile-loading">

          <div className="profile-spinner"></div>

          <p>
            Loading your profile...
          </p>

        </div>

      </main>
    );
  }


  return (
    <main className="profile-page">

      <div className="profile-container">


        {/* HEADER */}

        <div className="profile-header">

          <span className="section-label">
            MY ACCOUNT
          </span>

          <h1>
            My <span>Profile</span>
          </h1>

          <p>
            Manage your DigitalStore account
            information.
          </p>

        </div>


        {/* MESSAGES */}

        {error && (
          <div className="profile-message profile-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="profile-message profile-success">
            ✓ {success}
          </div>
        )}


        <div className="profile-layout">


          {/* =================================================
             PROFILE CARD
          ================================================= */}

          <section className="profile-card">

            <div className="profile-avatar">

              {(
                profile.name ||
                user.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}

            </div>


            <h2>
              {profile.name || user.name}
            </h2>


            <p>
              {profile.email || user.email}
            </p>


            <span className="profile-role">

              {profile.role === "admin"
                ? "Administrator"
                : "Customer"}

            </span>


            <div className="profile-card-divider"></div>


            <div className="profile-card-item">

              <span>
                📧
              </span>

              <div>
                <small>
                  Email
                </small>

                <strong>
                  {profile.email || user.email}
                </strong>
              </div>

            </div>


            <div className="profile-card-item">

              <span>
                📱
              </span>

              <div>
                <small>
                  Phone
                </small>

                <strong>
                  {profile.phone || "Not added"}
                </strong>
              </div>

            </div>

          </section>


          {/* =================================================
             DETAILS
          ================================================= */}

          <section className="profile-details">


            {!editing ? (

              <>
                <div className="profile-details-header">

                  <div>

                    <span className="summary-label">
                      ACCOUNT INFORMATION
                    </span>

                    <h2>
                      Personal Details
                    </h2>

                  </div>


                  <button
                    type="button"
                    className="edit-profile-button"
                    onClick={handleEdit}
                  >
                    ✏️ Edit Profile
                  </button>

                </div>


                <div className="profile-info-grid">


                  <div className="profile-info-item">

                    <span>
                      Full Name
                    </span>

                    <strong>
                      {profile.name ||
                        user.name ||
                        "Not available"}
                    </strong>

                  </div>


                  <div className="profile-info-item">

                    <span>
                      Email Address
                    </span>

                    <strong>
                      {profile.email ||
                        user.email ||
                        "Not available"}
                    </strong>

                    <small className="readonly-note">
                      Email cannot be changed
                    </small>

                  </div>


                  <div className="profile-info-item">

                    <span>
                      Phone Number
                    </span>

                    <strong>
                      {profile.phone ||
                        "Not added"}
                    </strong>

                  </div>


                  <div className="profile-info-item">

                    <span>
                      Account Type
                    </span>

                    <strong>
                      {profile.role === "admin"
                        ? "Administrator"
                        : "Customer"}
                    </strong>

                  </div>


                </div>


                <div className="profile-actions">

                  <Link
                    to="/orders"
                    className="primary-button"
                  >
                    📦 My Orders
                  </Link>

                  <Link
                    to="/products"
                    className="secondary-button"
                  >
                    🛍️ Browse Products
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="logout-profile-button"
                  >
                    🚪 Logout
                  </button>

                </div>

              </>

            ) : (

              /* =================================================
                 EDIT MODE
              ================================================= */

              <form
                className="profile-edit-form"
                onSubmit={handleSave}
              >

                <div className="profile-details-header">

                  <div>

                    <span className="summary-label">
                      EDIT ACCOUNT
                    </span>

                    <h2>
                      Edit Profile
                    </h2>

                  </div>

                </div>


                {/* NAME */}

                <div className="profile-form-group">

                  <label htmlFor="name">
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    autoComplete="name"
                    maxLength={100}
                  />

                </div>


                {/* EMAIL */}

                <div className="profile-form-group">

                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={
                      profile.email ||
                      user.email ||
                      ""
                    }
                    disabled
                  />

                  <small>
                    Email address cannot be changed
                    from your profile.
                  </small>

                </div>


                {/* PHONE */}

                <div className="profile-form-group">

                  <label htmlFor="phone">
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    maxLength={20}
                  />

                  <small>
                    Add a phone number for order
                    and account communication.
                  </small>

                </div>


                {/* BUTTONS */}

                <div className="profile-edit-actions">

                  <button
                    type="submit"
                    className="save-profile-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "✓ Save Changes"}
                  </button>


                  <button
                    type="button"
                    className="cancel-profile-button"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            )}

          </section>

        </div>

      </div>

    </main>
  );
}


export default Profile;