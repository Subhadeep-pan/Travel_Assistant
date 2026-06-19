import os
import re
import math
from typing import List, Dict

"""
RAG Engine (Retrieval-Augmented Generation)
===========================================
This is a simple, beginner-friendly search engine built in pure Python.
It helps our AI travel chatbot search through local travel guide documents.

How does it work?
1. Chunks: We split each travel guide (.md file) into small paragraphs (chunks).
2. Vocabulary: We find all unique words in our guides.
3. TF (Term Frequency): How many times a word appears in a chunk.
4. IDF (Inverse Document Frequency): How rare or common a word is across all chunks.
   If a word is very common (like "the" or "and"), it gets a low score.
   If a word is rare (like "rosogolla" or "metro"), it gets a high score.
5. TF-IDF Score: TF * IDF. It represents how important a word is to a specific chunk.
6. Cosine Similarity: A mathematical way to measure how similar the user's query is
   to a chunk of text, based on their TF-IDF scores.
"""

class SimpleTFIDFRetriever:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.documents = []  # List of chunks: {"text": str, "source": str, "tokens": List[str], "tf": Dict, "vector": Dict, "norm": float}
        self.vocabulary = set()
        self.doc_freqs = {}  # How many chunks contain each word
        self.num_docs = 0
        self.load_documents()

    def tokenize(self, text: str) -> List[str]:
        """
        Splits text into lowercase words.
        Example: "Hello Kolkata!" -> ["hello", "kolkata"]
        """
        return re.findall(r'\b\w+\b', text.lower())

    def load_documents(self):
        """
        Loads all travel guide markdown files, splits them into paragraphs,
        and builds the TF-IDF search index.
        """
        if not os.path.exists(self.data_dir):
            print(f"Warning: RAG data directory '{self.data_dir}' not found.")
            return
        
        # 1. Read files and split into chunks (paragraphs)
        for filename in os.listdir(self.data_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(self.data_dir, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Split by double newlines to get paragraphs
                paragraphs = content.split("\n\n")
                for p in paragraphs:
                    p = p.strip()
                    # Only index paragraphs that have actual content (more than 40 characters)
                    if len(p) > 40:
                        self.documents.append({
                            "text": p,
                            "source": filename
                        })
        
        self.num_docs = len(self.documents)
        if self.num_docs == 0:
            print("No documents indexed in RAG engine.")
            return

        # 2. Count term frequencies (TF) and document frequencies (DF)
        for doc in self.documents:
            tokens = self.tokenize(doc["text"])
            doc["tokens"] = tokens
            
            # Count word occurrences in this specific chunk (TF)
            tf = {}
            for token in tokens:
                tf[token] = tf.get(token, 0) + 1
            doc["tf"] = tf
            
            # Count how many chunks contain each word (DF)
            unique_tokens = set(tokens)
            for token in unique_tokens:
                self.doc_freqs[token] = self.doc_freqs.get(token, 0) + 1
                self.vocabulary.add(token)

        # 3. Calculate TF-IDF vectors and norms for all chunks
        for doc in self.documents:
            vector = {}
            len_squared = 0.0
            
            for word, tf_val in doc["tf"].items():
                df = self.doc_freqs.get(word, 0)
                # IDF formula: log(total_documents / documents_with_word) + 1
                # We add 1s to prevent division by zero or log of zero.
                idf = math.log((1 + self.num_docs) / (1 + df)) + 1
                tfidf = tf_val * idf
                vector[word] = tfidf
                len_squared += tfidf ** 2
            
            doc["vector"] = vector
            # The norm is the "length" of the vector, used to normalize cosine similarity
            doc["norm"] = math.sqrt(len_squared)

        print(f"RAG Engine successfully indexed {self.num_docs} chunks from {self.data_dir}.")

    def retrieve(self, query: str, city_filter: str = None, top_k: int = 3) -> List[Dict]:
        """
        Finds the top_k most relevant chunks for a user query.
        Can filter by city name (e.g., "kolkata", "delhi").
        """
        query_tokens = self.tokenize(query)
        if not query_tokens or self.num_docs == 0:
            return []

        # 1. Calculate TF-IDF vector for the user query
        query_tf = {}
        for token in query_tokens:
            query_tf[token] = query_tf.get(token, 0) + 1
        
        query_vector = {}
        query_len_squared = 0.0
        for word, tf_val in query_tf.items():
            if word in self.vocabulary:
                df = self.doc_freqs.get(word, 0)
                idf = math.log((1 + self.num_docs) / (1 + df)) + 1
                tfidf = tf_val * idf
                query_vector[word] = tfidf
                query_len_squared += tfidf ** 2
                
        query_norm = math.sqrt(query_len_squared)
        
        # If the query contains no words we know, fallback to basic word matching
        if query_norm == 0:
            results = []
            for doc in self.documents:
                # Filter by city (source filename contains city name, e.g. "kolkata.md")
                if city_filter and city_filter.lower() not in doc["source"].lower():
                    continue
                # Simple word overlap
                overlap = len(set(query_tokens) & set(doc["tokens"]))
                if overlap > 0:
                    results.append((overlap, doc))
            results.sort(key=lambda x: x[0], reverse=True)
            return [res[1] for res in results[:top_k]]

        # 2. Calculate Cosine Similarity with all documents
        scored_docs = []
        for doc in self.documents:
            # Filter by city (source filename contains city name, e.g. "kolkata.md")
            if city_filter and city_filter.lower() not in doc["source"].lower():
                continue
            
            # Dot Product
            dot_product = 0.0
            for word, q_tfidf in query_vector.items():
                if word in doc["vector"]:
                    dot_product += q_tfidf * doc["vector"][word]
            
            # Cosine similarity = Dot Product / (Query Norm * Doc Norm)
            similarity = 0.0
            if query_norm > 0 and doc["norm"] > 0:
                similarity = dot_product / (query_norm * doc["norm"])
            
            if similarity > 0:
                scored_docs.append((similarity, doc))

        # Sort documents by similarity score in descending order
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        # Return the top K documents
        return [doc for score, doc in scored_docs[:top_k]]
