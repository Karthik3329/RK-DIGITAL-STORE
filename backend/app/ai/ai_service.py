import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "llama3.2:3b"


SYSTEM_PROMPT = """
You are DigitalStore AI, the official AI shopping assistant for DigitalStore.

DigitalStore is a digital product marketplace.

You can help customers with:
- Products
- Product prices
- Product details
- Shopping
- Orders
- Payments
- Downloads
- Accounts
- Website navigation

IMPORTANT RULES:

1. Never invent product information.
2. Never invent prices.
3. Never invent order information.
4. Never invent payment status.
5. Never invent download links.
6. Use tool results whenever real DigitalStore information is required.
7. If information is unavailable, clearly say that you cannot access it.
8. Never expose passwords, JWT tokens, API keys, or internal information.
9. Keep answers concise and professional.
10. Do not mention Ollama unless the customer specifically asks.
"""


def generate_ai_response(
    message: str,
    conversation_history=None,
    context=None
):
    if not message or not message.strip():
        return "Please enter a message."

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]

    if context:
        messages.append({
            "role": "system",
            "content": f"""
Verified DigitalStore information:

{context}

Use ONLY this information for store-specific facts.
"""
        })

    if conversation_history:
        for item in conversation_history:
            role = item.get("role")
            content = item.get("content")

            if role in ["user", "assistant"] and content:
                messages.append({
                    "role": role,
                    "content": content
                })

    messages.append({
        "role": "user",
        "content": message.strip()
    })

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        return data["message"]["content"]

    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            "AI service is not running. Please start Ollama."
        )

    except requests.exceptions.Timeout:
        raise RuntimeError(
            "AI response timed out. Please try again."
        )

    except requests.exceptions.RequestException as error:
        raise RuntimeError(
            f"AI service error: {str(error)}"
        )

    except Exception as error:
        raise RuntimeError(
            f"Unexpected AI error: {str(error)}"
        )