import smtplib
import ssl

from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings


def send_email(
    to_email,
    subject,
    html_content,
    text_content=""
):

    if not settings.SMTP_USERNAME:
        raise ValueError(
            "SMTP_USERNAME is not configured."
        )

    if not settings.SMTP_PASSWORD:
        raise ValueError(
            "SMTP_PASSWORD is not configured."
        )

    msg = EmailMessage()

    msg["Subject"] = subject

    msg["From"] = formataddr(
        (
            settings.SMTP_FROM_NAME,
            settings.SMTP_FROM_EMAIL
            or settings.SMTP_USERNAME
        )
    )

    msg["To"] = to_email

    msg.set_content(
        text_content
        or
        "Please view this email in an HTML-compatible email client."
    )

    msg.add_alternative(
        html_content,
        subtype="html"
    )

    context = ssl.create_default_context()

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=30
    ) as server:

        server.ehlo()

        server.starttls(
            context=context
        )

        server.ehlo()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD
        )

        server.send_message(
            msg
        )


def send_download_email(
    customer_name,
    customer_email,
    order_number,
    total,
    products
):

    product_html = ""

    product_text = ""

    for product in products:

        title = product.get(
            "title",
            "Digital Product"
        )

        download_url = product.get(
            "download_url",
            ""
        )

        product_html += f"""
        <div style="
            margin-bottom:20px;
            padding:18px;
            border:1px solid #ddd;
            border-radius:12px;
        ">

            <h3 style="
                margin-top:0;
            ">
                {title}
            </h3>

            <a
                href="{download_url}"
                style="
                    display:inline-block;
                    padding:12px 20px;
                    background:#6d28d9;
                    color:white;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:bold;
                "
            >
                Download Product
            </a>

        </div>
        """

        product_text += (
            f"{title}\n"
            f"{download_url}\n\n"
        )

    html_content = f"""
    <!DOCTYPE html>

    <html>

    <body style="
        font-family:Arial,sans-serif;
        background:#f5f5f5;
        padding:30px;
    ">

        <div style="
            max-width:650px;
            margin:auto;
            background:white;
            padding:30px;
            border-radius:16px;
        ">

            <h1>
                🎉 Payment Approved
            </h1>

            <p>
                Hello {customer_name},
            </p>

            <p>
                Your payment has been
                successfully verified.
            </p>

            <p>
                <strong>
                    Order:
                </strong>
                {order_number}
            </p>

            <p>
                <strong>
                    Amount:
                </strong>
                ₹{total:.2f}
            </p>

            <hr>

            <h2>
                Your Downloads
            </h2>

            {product_html}

            <hr>

            <p style="
                color:#666;
                font-size:13px;
            ">
                Download links are secure
                and expire after the configured
                period.
            </p>

            <p>
                Thank you for your purchase!
            </p>

            <strong>
                DigitalStore
            </strong>

        </div>

    </body>

    </html>
    """

    text_content = f"""
DigitalStore

Hello {customer_name},

Your payment has been successfully verified.

Order: {order_number}
Amount: ₹{total:.2f}

Your Downloads:

{product_text}

Thank you for your purchase!

DigitalStore
"""

    send_email(
        to_email=customer_email,
        subject=(
            f"Payment Approved - "
            f"Order {order_number}"
        ),
        html_content=html_content,
        text_content=text_content,
    )