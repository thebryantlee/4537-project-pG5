$('#translateButton').click(function () {
    let sourceText = $('#sourceText').val();
    let sourceLang = $('#sourceLanguage').val();
    let targetLang = $('#targetLanguage').val();

    // Prepare the data for the API call
    let requestData = {
        "text": sourceText,
        "source_language": sourceLang,
        "target_language": targetLang
    };

    console.log("Making API Call");

    // Make the API call to the translation service
    $.ajax({
        url: 'https://588d-2604-3d08-657c-8100-912d-2b88-2ba-b66e.ngrok-free.app/translate',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function (response) {
            // Assuming the API returns a JSON object with the translation in a field called 'translation_text'
            let translation = response.translation;
            console.log("Translation:", translation);
            $('#translatedText').val(translation);
        },
        error: function (xhr, status, error) {
            // Handle any errors here
            console.error("Translation API error:", status, error);
        }
    });
});
