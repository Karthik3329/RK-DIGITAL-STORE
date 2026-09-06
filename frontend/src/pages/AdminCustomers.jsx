import {
  useEffect,
  useState,
} from "react";

import {
  getCustomers,
  getCustomer,
} from "../services/adminService";

function AdminCustomers() {

  const [customers, setCustomers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  const loadCustomers = async () => {

    try {

      setLoading(true);

      const result =
        await getCustomers(search);

      setCustomers(
        result.customers || []
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {
    loadCustomers();
  }, []);


  const handleSearch = (event) => {

    event.preventDefault();

    loadCustomers();

  };


  const viewCustomer = async (
    customerId
  ) => {

    try {

      const result =
        await getCustomer(
          customerId
        );

      setSelectedCustomer(
        result
      );

    } catch (error) {

      alert(
        error.response?.data?.detail ||
        "Unable to load customer."
      );

    }

  };


  return (
    <div className="admin-page">

      <div className="admin-page-heading">

        <div>
          <span>
            USERS
          </span>

          <h2>
            Customers
          </h2>

          <p>
            Manage your registered
            customers.
          </p>
        </div>

      </div>


      <form
        className="admin-search-bar"
        onSubmit={handleSearch}
      >

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search name or email..."
        />

        <button>
          Search
        </button>

      </form>


      <div className="admin-section-card">

        {loading ? (

          <div className="admin-loading">
            Loading customers...
          </div>

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>

                <tr>
                  <th>CUSTOMER</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>ORDERS</th>
                  <th>TOTAL SPENT</th>
                  <th></th>
                </tr>

              </thead>


              <tbody>

                {customers.map(
                  (customer) => (

                    <tr key={customer.id}>

                      <td>
                        <strong>
                          {
                            customer.name
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          customer.email
                        }
                      </td>

                      <td>
                        {
                          customer.phone ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          customer.order_count
                        }
                      </td>

                      <td>
                        ₹
                        {Number(
                          customer.total_spent ||
                            0
                        ).toFixed(2)}
                      </td>

                      <td>
                        <button
                          className="table-action-button"
                          onClick={() =>
                            viewCustomer(
                              customer.id
                            )
                          }
                        >
                          View
                        </button>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {selectedCustomer && (

        <div className="admin-modal-overlay">

          <div className="admin-modal">

            <div className="admin-modal-header">

              <div>
                <span>
                  CUSTOMER
                </span>

                <h3>
                  {
                    selectedCustomer
                      .customer?.name
                  }
                </h3>
              </div>

              <button
                onClick={() =>
                  setSelectedCustomer(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="customer-detail-grid">

              <div>
                <span>
                  EMAIL
                </span>

                <strong>
                  {
                    selectedCustomer
                      .customer?.email
                  }
                </strong>
              </div>

              <div>
                <span>
                  PHONE
                </span>

                <strong>
                  {
                    selectedCustomer
                      .customer?.phone ||
                    "—"
                  }
                </strong>
              </div>

            </div>


            <h4>
              Order History
            </h4>


            <div className="customer-order-list">

              {selectedCustomer.orders?.map(
                (order) => (

                  <div
                    className="customer-order"
                    key={order.id}
                  >

                    <div>
                      <strong>
                        {
                          order.order_number
                        }
                      </strong>

                      <span>
                        {
                          order.payment_status
                        }
                      </span>
                    </div>

                    <strong>
                      ₹
                      {Number(
                        order.total || 0
                      ).toFixed(2)}
                    </strong>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminCustomers;