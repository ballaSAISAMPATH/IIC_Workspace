from langchain_core.prompts import ChatPromptTemplate

encryption_prompt = ChatPromptTemplate.from_messages(
      [
            ("system", "you are a mapping assistant that identifies the sensitive parts of the text like names,"
            " locations and dates nad replace them with placeholders like person_A , person_B, etc , si"
            "milarly for locations and dates with location_A, location_B and date_A, date_B respectively."
            " you should also maintain a mapping of the placeholders to the original values in a dictionary format and return that as well"),
            ("human", "Here is the text that needs to be anonymized: {text}")
      ]
)


