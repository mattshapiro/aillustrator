import React, { useState, useEffect } from 'react';

// Main App component for the Story Illustrator
const App = () => {
  // State variables to manage user inputs and application data
  const [story, setStory] = useState(''); // Stores the user's story text
  const [stylePrompt, setStylePrompt] = useState('fantasy art, vibrant colors'); // Stores the desired illustration style
  const [numIllustrations, setNumIllustrations] = useState(3); // Stores the number of illustrations requested
  const [illustrationPrompts, setIllustrationPrompts] = useState([]); // Stores the generated illustration prompts
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false); // Loading state for prompt generation
  const [promptError, setPromptError] = useState(''); // Error message for prompt generation
  const [message, setMessage] = useState(''); // General message display (e.g., for success or minor errors)
  const [geminiApiKey, setGeminiApiKey] = useState(''); // Stores the optional Gemini API key

  // State for character management
  const [showCharacterInput, setShowCharacterInput] = useState(false); // Controls visibility of character input section
  const [characters, setCharacters] = useState([]); // Stores an array of character objects { id, name, description }
  const [currentCharacterName, setCurrentCharacterName] = useState(''); // Input for current character name
  const [currentCharacterDescription, setCurrentCharacterDescription] = useState(''); // Input for current character description
  const [editingCharacterId, setEditingCharacterId] = useState(null); // ID of character being edited

  // --- Local Storage Hooks ---
  // Load story from local storage on component mount
  useEffect(() => {
    const savedStory = localStorage.getItem('storyIllustrator_story');
    if (savedStory) {
      setStory(savedStory);
    }
  }, []);

  // Save story to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('storyIllustrator_story', story);
  }, [story]);

  // Load stylePrompt from local storage on component mount
  useEffect(() => {
    const savedStylePrompt = localStorage.getItem('storyIllustrator_stylePrompt');
    if (savedStylePrompt) {
      setStylePrompt(savedStylePrompt);
    }
  }, []);

  // Save stylePrompt to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('storyIllustrator_stylePrompt', stylePrompt);
  }, [stylePrompt]);

  // Load numIllustrations from local storage on component mount
  useEffect(() => {
    const savedNumIllustrations = localStorage.getItem('storyIllustrator_numIllustrations');
    if (savedNumIllustrations) {
      setNumIllustrations(parseInt(savedNumIllustrations));
    }
  }, []);

  // Save numIllustrations to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('storyIllustrator_numIllustrations', numIllustrations.toString());
  }, [numIllustrations]);

  // Load characters from local storage on component mount
  useEffect(() => {
    const savedCharacters = localStorage.getItem('storyIllustrator_characters');
    if (savedCharacters) {
      try {
        setCharacters(JSON.parse(savedCharacters));
      } catch (e) {
        console.error("Failed to parse characters from local storage", e);
        setCharacters([]); // Reset if parsing fails
      }
    }
  }, []);

  // Save characters to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('storyIllustrator_characters', JSON.stringify(characters));
  }, [characters]);

  // Load currentCharacterName from local storage on component mount
  useEffect(() => {
    const savedName = localStorage.getItem('storyIllustrator_currentCharacterName');
    if (savedName) {
      setCurrentCharacterName(savedName);
    }
  }, []);

  // Save currentCharacterName to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('storyIllustrator_currentCharacterName', currentCharacterName);
  }, [currentCharacterName]);

  // Load currentCharacterDescription from local storage on component mount
  useEffect(() => {
    const savedDesc = localStorage.getItem('storyIllustrator_currentCharacterDescription');
    if (savedDesc) {
      setCurrentCharacterDescription(savedDesc);
    }
  }, []);

  // Save currentCharacterDescription to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('storyIllustrator_currentCharacterDescription', currentCharacterDescription);
  }, [currentCharacterDescription]);

  // Load geminiApiKey from local storage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('storyIllustrator_geminiApiKey');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
    }
  }, []);

  // Save geminiApiKey to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('storyIllustrator_geminiApiKey', geminiApiKey);
  }, [geminiApiKey]);

  // --- Clear Input Functions ---
  const clearStory = () => setStory('');
  const clearStylePrompt = () => setStylePrompt('');
  const clearNumIllustrations = () => setNumIllustrations(1); // Reset to default 1
  const clearCurrentCharacterName = () => setCurrentCharacterName('');
  const clearCurrentCharacterDescription = () => setCurrentCharacterDescription('');
  const clearGeminiApiKey = () => setGeminiApiKey('');


  // Function to add or update a character
  const handleAddOrUpdateCharacter = () => {
    if (!currentCharacterName.trim() || !currentCharacterDescription.trim()) {
      setMessage('Please enter both character name and description.');
      return;
    }

    if (editingCharacterId) {
      // Update existing character
      setCharacters(prevChars =>
        prevChars.map(char =>
          char.id === editingCharacterId
            ? { ...char, name: currentCharacterName, description: currentCharacterDescription }
            : char
        )
      );
      setEditingCharacterId(null); // Exit editing mode
      setMessage('Character updated successfully!');
    } else {
      // Add new character
      setCharacters(prevChars => [
        ...prevChars,
        { id: Date.now(), name: currentCharacterName, description: currentCharacterDescription }
      ]);
      setMessage('Character added successfully!');
    }
    // Clear input fields
    clearCurrentCharacterName();
    clearCurrentCharacterDescription();
  };

  // Function to start editing a character
  const handleEditCharacter = (id) => {
    const charToEdit = characters.find(char => char.id === id);
    if (charToEdit) {
      setCurrentCharacterName(charToEdit.name);
      setCurrentCharacterDescription(charToEdit.description);
      setEditingCharacterId(id);
      setMessage(''); // Clear any previous messages
    }
  };

  // Function to remove a character
  const handleRemoveCharacter = (id) => {
    setCharacters(prevChars => prevChars.filter(char => char.id !== id));
    setMessage('Character removed.');
    // If the removed character was being edited, clear editing state
    if (editingCharacterId === id) {
      setEditingCharacterId(null);
      clearCurrentCharacterName();
      clearCurrentCharacterDescription();
    }
  };


  // Function to handle the generation of an image for a specific prompt
  const handleGenerateImage = async (id) => {
    setIllustrationPrompts(prevPrompts =>
      prevPrompts.map(p =>
        p.id === id ? { ...p, isLoading: true, error: '', imageUrls: [] } : p
      )
    );
    setMessage('');

    const promptToGenerate = illustrationPrompts.find(p => p.id === id);
    if (!promptToGenerate || !promptToGenerate.promptText.trim()) {
      setIllustrationPrompts(prevPrompts =>
        prevPrompts.map(p =>
          p.id === id ? { ...p, isLoading: false, error: 'Prompt text is empty.' } : p
        )
      );
      return;
    }

    try {
      // Define the payload for the Imagen API request
      const payload = {
        instances: { prompt: promptToGenerate.promptText },
        parameters: { "sampleCount": promptToGenerate.numImagesToGenerate } // Use the selected number of images
      };

      // Use user-provided API key if available, otherwise use empty string for Canvas to inject
      const apiKey = geminiApiKey || "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

      // Make the fetch call to the Imagen API for image generation
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      // Check if the response contains valid predictions and image data
      if (result.predictions && result.predictions.length > 0) {
        const newImageUrls = result.predictions.map(prediction => {
          if (prediction.bytesBase64Encoded) {
            return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
          }
          return ''; // Return empty string if no image data
        }).filter(url => url !== ''); // Filter out empty strings

        setIllustrationPrompts(prevPrompts =>
          prevPrompts.map(p =>
            p.id === id ? { ...p, imageUrls: newImageUrls, isLoading: false } : p
          )
        );
      } else {
        setIllustrationPrompts(prevPrompts =>
          prevPrompts.map(p =>
            p.id === id ? { ...p, isLoading: false, error: 'No image data received.' } : p
          )
        );
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setIllustrationPrompts(prevPrompts =>
        prevPrompts.map(p =>
          p.id === id ? { ...p, isLoading: false, error: `Failed to generate image: ${error.message}` } : p
        )
      );
    }
  };

  // Function to handle the generation of illustration prompts
  const handleGeneratePrompts = async () => {
    if (!story.trim()) {
      setMessage('Please enter a story to generate prompts.');
      return;
    }
    if (numIllustrations <= 0) {
      setMessage('Please request at least one illustration.');
      return;
    }

    setIsGeneratingPrompts(true);
    setPromptError('');
    setIllustrationPrompts([]); // Clear previous prompts
    setMessage('Generating illustration prompts...');

    try {
      // Construct the prompt for the Gemini API to generate illustration descriptions
      let userPrompt = `Based on the following story, generate ${numIllustrations} highly detailed illustration prompts. Each prompt should describe a key scene or character from the story, focusing on key visual elements, atmosphere, and character actions, suitable for an image generation model. Seamlessly incorporate relevant character descriptions from the provided list into each prompt. Incorporate the style "${stylePrompt}" into each prompt.`;

      // Add character descriptions to the prompt if available
      if (characters.length > 0) {
        userPrompt += `\n\nCharacters and their descriptions:\n`;
        characters.forEach(char => {
          userPrompt += `Character Name: ${char.name}, Description: ${char.description}\n`;
        });
      }

      userPrompt += `\nStory:\n${story}\n\nProvide the output as a JSON array of strings, where each string is an illustration prompt. For example: ["Prompt 1", "Prompt 2"]`;

      // Define the payload for the Gemini API request
      const payload = {
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        }
      };

      // Use user-provided API key if available, otherwise use empty string for Canvas to inject
      const apiKey = geminiApiKey || "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedPrompts = JSON.parse(jsonString);

        const newPrompts = parsedPrompts.map((prompt, index) => ({
          id: `prompt-${Date.now()}-${index}`, // Unique ID for each prompt
          promptText: prompt,
          imageUrls: [], // Initialize image URLs as an empty array
          numImagesToGenerate: 1, // Default to 1 image per prompt for initial generation
          isLoading: false, // Loading state for individual image generation
          error: '' // Error for individual image generation
        }));
        setIllustrationPrompts(newPrompts);
        setMessage('Illustration prompts generated successfully! Now generating initial images...');

        // Automatically generate images for the newly created prompts
        for (const promptItem of newPrompts) {
          await handleGenerateImage(promptItem.id);
        }

        setMessage('All initial illustration prompts and images generated!');

      } else {
        setPromptError('Could not generate prompts. The API response was empty or malformed.');
      }
    } catch (error) {
      console.error('Error generating prompts:', error);
      setPromptError(`Failed to generate prompts: ${error.message}`);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };


  // Function to handle changes in the editable prompt text field
  const handlePromptChange = (id, newText) => {
    setIllustrationPrompts(prevPrompts =>
      prevPrompts.map(p =>
        p.id === id ? { ...p, promptText: newText } : p
      )
    );
  };

  // Function to handle changes in the number of images to generate for a prompt
  const handleNumImagesChange = (id, newNum) => {
    setIllustrationPrompts(prevPrompts =>
      prevPrompts.map(p =>
        p.id === id ? { ...p, numImagesToGenerate: parseInt(newNum) } : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 sm:p-6 font-sans flex flex-col items-center">
      {/* Header Section */}
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-800 mb-2 drop-shadow-lg">
          Story Illustrator
        </h1>
        <p className="text-lg sm:text-xl text-gray-700">
          Generate custom illustrations for your stories using AI.
        </p>
      </header>

      {/* Input Section */}
      <section className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl mb-8 border border-purple-200">
        <div className="mb-6">
          <label htmlFor="story" className="block text-gray-800 text-lg font-semibold mb-2">
            Your Story:
          </label>
          <div className="relative">
            <textarea
              id="story"
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out resize-y min-h-[150px] sm:min-h-[200px] text-gray-700"
              rows="8"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Enter your story here. The more detailed, the better!"
            ></textarea>
            {story && (
              <button
                onClick={clearStory}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Clear story"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="stylePrompt" className="block text-gray-800 text-lg font-semibold mb-2">
              Illustration Style:
            </label>
            <div className="relative">
              <input
                type="text"
                id="stylePrompt"
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out text-gray-700"
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="e.g., 'watercolor, dystopian, vibrant colors'"
              />
              {stylePrompt && (
                <button
                  onClick={clearStylePrompt}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear style prompt"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="numIllustrations" className="block text-gray-800 text-lg font-semibold mb-2">
              Number of Prompts:
            </label>
            <div className="relative">
              <input
                type="number"
                id="numIllustrations"
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out text-gray-700"
                value={numIllustrations}
                onChange={(e) => setNumIllustrations(Math.max(1, parseInt(e.target.value) || 1))} // Ensure at least 1
                min="1"
              />
              {numIllustrations > 1 && ( // Only show clear if not default 1
                <button
                  onClick={clearNumIllustrations}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear number of illustrations"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gemini API Key Input */}
        <div className="mb-6">
          <label htmlFor="geminiApiKey" className="block text-gray-800 text-lg font-semibold mb-2">
            Gemini API Key (Optional):
          </label>
          <div className="relative">
            <input
              type="text"
              id="geminiApiKey"
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 ease-in-out text-gray-700"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Gemini API key here (e.g., AIza...)"
            />
            {geminiApiKey && (
              <button
                onClick={clearGeminiApiKey}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Clear API key"
              >
                &times;
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            If left blank, the application will attempt to use an environment-provided key.
          </p>
        </div>


        {/* Add Characters Button */}
        <button
          onClick={() => setShowCharacterInput(!showCharacterInput)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center mb-6"
        >
          {showCharacterInput ? 'Hide Character Input' : 'Add Characters (Optional)'}
        </button>

        {/* Character Input Section */}
        {showCharacterInput && (
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              {editingCharacterId ? 'Edit Character' : 'Add New Character'}
            </h3>
            <div className="mb-4">
              <label htmlFor="characterName" className="block text-gray-700 text-md font-semibold mb-2">
                Character Name:
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="characterName"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out text-gray-700"
                  value={currentCharacterName}
                  onChange={(e) => setCurrentCharacterName(e.target.value)}
                  placeholder="e.g., 'Elara the Sorceress'"
                />
                {currentCharacterName && (
                  <button
                    onClick={clearCurrentCharacterName}
                    className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label="Clear character name"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="characterDescription" className="block text-gray-700 text-md font-semibold mb-2">
                Character Description:
              </label>
              <div className="relative">
                <textarea
                  id="characterDescription"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out resize-y min-h-[80px] text-gray-700"
                  rows="3"
                  value={currentCharacterDescription}
                  onChange={(e) => setCurrentCharacterDescription(e.target.value)}
                  placeholder="e.g., 'A young woman with fiery red hair, piercing green eyes, and a magical staff.'"
                ></textarea>
                {currentCharacterDescription && (
                  <button
                    onClick={clearCurrentCharacterDescription}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label="Clear character description"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={handleAddOrUpdateCharacter}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {editingCharacterId ? 'Update Character' : 'Add Character'}
            </button>

            {characters.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Added Characters:</h4>
                <ul className="space-y-3">
                  {characters.map(char => (
                    <li key={char.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex-grow mb-2 sm:mb-0">
                        <span className="font-bold text-gray-800">{char.name}:</span>{' '}
                        <span className="text-gray-600 text-sm">{char.description}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCharacter(char.id)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3 rounded-md transition duration-200 ease-in-out"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveCharacter(char.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded-md transition duration-200 ease-in-out"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGeneratePrompts}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center"
          disabled={isGeneratingPrompts}
        >
          {isGeneratingPrompts ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Prompts & Images...
            </>
          ) : (
            'Generate Illustration Prompts'
          )}
        </button>

        {/* Message and Error Display */}
        {message && (
          <p className="mt-4 text-center text-green-600 font-medium">{message}</p>
        )}
        {promptError && (
          <p className="mt-4 text-center text-red-600 font-medium">{promptError}</p>
        )}
      </section>

      {/* Illustration Prompts and Images Section */}
      {illustrationPrompts.length > 0 && (
        <section className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl border border-purple-200">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Illustration Prompts</h2>
          <div className="space-y-8">
            {illustrationPrompts.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-5 shadow-sm bg-gray-50">
                <label htmlFor={`prompt-${item.id}`} className="block text-gray-700 text-md font-semibold mb-2">
                  Editable Prompt:
                </label>
                <textarea
                  id={`prompt-${item.id}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out resize-y min-h-[80px] text-gray-800"
                  value={item.promptText}
                  onChange={(e) => handlePromptChange(item.id, e.target.value)}
                  rows="3"
                ></textarea>

                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                  <div className="w-full sm:w-auto">
                    <label htmlFor={`num-images-${item.id}`} className="block text-gray-700 text-md font-semibold mb-2 sm:mb-0">
                      Images to Generate:
                    </label>
                    <select
                      id={`num-images-${item.id}`}
                      className="w-full sm:w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out text-gray-700"
                      value={item.numImagesToGenerate}
                      onChange={(e) => handleNumImagesChange(item.id, e.target.value)}
                    >
                      <option value="1">1 Image</option>
                      <option value="2">2 Images</option>
                      <option value="3">3 Images</option>
                      <option value="4">4 Images</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleGenerateImage(item.id)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                    disabled={item.isLoading || !item.promptText.trim()}
                  >
                    {item.isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Image(s)...
                      </>
                    ) : (
                      'Generate Image(s)'
                    )}
                  </button>
                </div>

                {item.error && (
                  <p className="mt-2 text-center text-red-500 text-sm">{item.error}</p>
                )}

                {item.imageUrls.length > 0 && (
                  <div className="mt-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Generated Image(s):</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 justify-items-center">
                      {item.imageUrls.map((imageUrl, idx) => (
                        <div key={idx} className="w-full max-w-xs sm:max-w-none">
                          <img
                            src={imageUrl}
                            alt={`${item.promptText} - ${idx + 1}`}
                            className="w-full h-auto object-contain rounded-lg shadow-md border border-gray-200 mx-auto"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x300/E0E0E0/666666?text=Image+Load+Error"; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tailwind CSS Script (for styling) */}
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>
    </div>
  );
};

export default App;
