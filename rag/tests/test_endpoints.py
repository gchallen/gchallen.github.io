import os
import pytest
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings

load_dotenv()


def test_chat_endpoint():
    """Test that the Azure OpenAI chat endpoint is configured and working."""

    chat_endpoint = os.getenv("AZURE_OPENAI_CHAT_ENDPOINT")
    chat_api_key = os.getenv("AZURE_OPENAI_CHAT_API_KEY")

    assert chat_endpoint, "AZURE_OPENAI_CHAT_ENDPOINT environment variable not set"
    assert chat_api_key, "AZURE_OPENAI_CHAT_API_KEY environment variable not set"

    # Extract deployment name from endpoint URL
    # Example: https://xxx.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-10-21
    import re

    match = re.search(r"/deployments/([^/]+)/", chat_endpoint)
    deployment_name = match.group(1) if match else "gpt-4o"

    # Extract base URL and API version
    base_url = chat_endpoint.split("/openai/")[0]
    api_version_match = re.search(r"api-version=([^&]+)", chat_endpoint)
    api_version = api_version_match.group(1) if api_version_match else "2024-10-21"

    # Create chat model
    llm = AzureChatOpenAI(
        azure_endpoint=base_url,
        azure_deployment=deployment_name,
        api_key=chat_api_key,
        api_version=api_version,
        temperature=0,
    )

    # Test with a simple message
    response = llm.invoke("Say 'Hello, RAG system is working!' and nothing else.")

    assert response, "No response from chat endpoint"
    assert response.content, "Response has no content"
    assert len(response.content) > 0, "Response content is empty"

    print(f"✓ Chat endpoint test passed")
    print(f"  Response: {response.content[:100]}...")


def test_embeddings_endpoint():
    """Test that the Azure OpenAI embeddings endpoint is configured and working."""

    embeddings_endpoint = os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
    embeddings_api_key = os.getenv("AZURE_OPENAI_EMBEDDINGS_API_KEY")

    assert embeddings_endpoint, (
        "AZURE_OPENAI_EMBEDDINGS_ENDPOINT environment variable not set"
    )
    assert embeddings_api_key, (
        "AZURE_OPENAI_EMBEDDINGS_API_KEY environment variable not set"
    )

    # Extract deployment name from endpoint URL
    import re

    match = re.search(r"/deployments/([^/]+)/", embeddings_endpoint)
    deployment_name = match.group(1) if match else "text-embedding-3-large"

    # Extract base URL and API version
    base_url = embeddings_endpoint.split("/openai/")[0]
    api_version_match = re.search(r"api-version=([^&]+)", embeddings_endpoint)
    api_version = api_version_match.group(1) if api_version_match else "2023-05-15"

    # Create embeddings model
    embeddings = AzureOpenAIEmbeddings(
        azure_endpoint=base_url,
        azure_deployment=deployment_name,
        api_key=embeddings_api_key,
        api_version=api_version,
    )

    # Test with a simple text
    test_text = "This is a test document for the RAG system."
    embedding_vector = embeddings.embed_query(test_text)

    assert embedding_vector, "No embedding vector returned"
    assert isinstance(embedding_vector, list), "Embedding vector is not a list"
    assert len(embedding_vector) > 0, "Embedding vector is empty"
    assert all(isinstance(x, (int, float)) for x in embedding_vector), (
        "Embedding vector contains non-numeric values"
    )

    print(f"✓ Embeddings endpoint test passed")
    print(f"  Embedding dimension: {len(embedding_vector)}")
    print(f"  First 5 values: {embedding_vector[:5]}")


if __name__ == "__main__":
    print("Testing Azure OpenAI endpoints...\n")

    try:
        test_chat_endpoint()
        print()
        test_embeddings_endpoint()
        print("\n✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise
