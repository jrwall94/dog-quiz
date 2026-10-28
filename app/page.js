"use client";

import { useEffect, useRef, useState } from "react";

function chooseRandomDog(breeds, previousImageUrl) {
  const imageChoices = breeds.flatMap((breed) =>
    breed.images
      .filter((image) => image.url)
      .map((image) => ({
        breedId: breed.id,
        breedName: breed.name,
        image,
      })),
  );
  const newImageChoices = imageChoices.filter(
    ({ image }) => image.url !== previousImageUrl,
  );
  const choices = newImageChoices.length > 0 ? newImageChoices : imageChoices;
  return choices[Math.floor(Math.random() * choices.length)];
}

export default function Home() {
  const [breedList, setBreedList] = useState([]);
  const [currentDog, setCurrentDog] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoadingBreeds, setIsLoadingBreeds] = useState(true);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredBreeds = breedList.filter((breed) =>
    breed.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  const isCorrect = currentDog?.breedName === selectedBreed;

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    async function loadBreeds() {
      try {
        const response = await fetch(
          "https://dogapi.dog/api/v2/breeds?page[size]=500",
        );
        if (!response.ok) {
          throw new Error(`Dog API returned ${response.status}`);
        }

        const body = await response.json();
        const breeds = body.data
          .map((breed) => ({
            id: breed.id,
            name: breed.attributes.name,
            images: breed.attributes.images ?? [],
          }))
          .filter((breed) => breed.images.some((image) => image.url));

        if (breeds.length === 0) {
          throw new Error("Dog API returned no breeds with images");
        }

        setBreedList(breeds);
        setCurrentDog(chooseRandomDog(breeds));
      } catch (loadError) {
        console.error("Could not load dog breeds:", loadError);
        setError("We couldn’t load the dogs. Please refresh to try again.");
      } finally {
        setIsLoadingBreeds(false);
      }
    }

    loadBreeds();
  }, []);

  function selectBreed(breedName) {
    setSelectedBreed(breedName);
    setSearchTerm("");
    setIsOpen(false);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "ArrowDown" && filteredBreeds.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filteredBreeds.length - 1));
    } else if (event.key === "ArrowUp" && filteredBreeds.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && filteredBreeds[activeIndex]) {
      event.preventDefault();
      selectBreed(filteredBreeds[activeIndex].name);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      triggerRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedBreed || !currentDog || isSubmitted) {
      return;
    }
    setIsSubmitted(true);
    setIsOpen(false);
    setSearchTerm("");
  }

  function loadNewDog() {
    if (breedList.length === 0) {
      return;
    }
    setCurrentDog(chooseRandomDog(breedList, currentDog?.image.url));
    setSelectedBreed("");
    setSearchTerm("");
    setIsOpen(false);
    setIsSubmitted(false);
    setImageError(false);
    setIsLoadingImage(true);
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            🐾
          </span>
          <span>Dog Quiz</span>
        </div>
        <span className="header-note">A quiz just for you Soph ❤️</span>
      </header>

      <main className="quiz-main">
        <div className="intro">
          <p className="eyebrow">THE BREED GUESSING GAME</p>
          <h1>Who’s a good breed?</h1>
          <p className="intro-copy">
            Take a look at your mystery pup, pick a breed, and see if you got it
            right.
          </p>
        </div>

        <section className="quiz-card" aria-labelledby="quiz-question">
          <div className="photo-panel">
            {currentDog && !imageError ? (
              <>
                {isLoadingImage && (
                  <div className="image-loading" role="status">
                    Finding your mystery dog…
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={`dog-photo${isLoadingImage ? " is-loading" : ""}`}
                  src={currentDog.image.large ?? currentDog.image.url}
                  alt="A mystery dog. Can you guess the breed?"
                  onLoad={() => setIsLoadingImage(false)}
                  onError={() => {
                    setIsLoadingImage(false);
                    setImageError(true);
                  }}
                />
              </>
            ) : imageError ? (
              <div className="image-message" role="status">
                This pup’s picture didn’t load. Try another dog!
              </div>
            ) : (
              <div className="image-loading" role="status">
                {isLoadingBreeds
                  ? "Finding your mystery dog…"
                  : "Dog picture unavailable."}
              </div>
            )}
          </div>

          <div className="quiz-content">
            <p className="round-label">YOUR TURN</p>
            <h2 id="quiz-question">What breed is this dog?</h2>

            {error ? (
              <p className="error-message" role="alert">
                {error}
              </p>
            ) : (
              <form className="answer-form" onSubmit={handleSubmit}>
                <span className="field-label" id="breed-select-label">
                  Your guess
                </span>
                <div
                  className="breed-dropdown"
                  ref={dropdownRef}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsOpen(false);
                      setSearchTerm("");
                    }
                  }}
                >
                  <button
                    ref={triggerRef}
                    type="button"
                    className="breed-trigger"
                    aria-labelledby="breed-select-label"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? "breed-options" : undefined}
                    disabled={isLoadingBreeds || isSubmitted || !currentDog}
                    onClick={() => {
                      setSearchTerm("");
                      setActiveIndex(0);
                      setIsOpen((open) => !open);
                    }}
                  >
                    <span className={selectedBreed ? "" : "placeholder"}>
                      {selectedBreed || "Choose a breed"}
                    </span>
                    <span className="dropdown-chevron" aria-hidden="true">
                      {isOpen ? "⌃" : "⌄"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="breed-menu">
                      <label className="sr-only" htmlFor="breed-search">
                        Search breeds
                      </label>
                      <input
                        ref={searchInputRef}
                        id="breed-search"
                        type="search"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded="true"
                        aria-controls="breed-options"
                        aria-activedescendant={
                          filteredBreeds[activeIndex]
                            ? `breed-option-${activeIndex}`
                            : undefined
                        }
                        className="breed-search"
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                          setActiveIndex(0);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Type to find a breed…"
                        autoComplete="off"
                      />
                      <ul
                        id="breed-options"
                        role="listbox"
                        aria-labelledby="breed-select-label"
                        className="breed-options"
                      >
                        {filteredBreeds.length === 0 ? (
                          <li className="no-options" role="status">
                            No breeds match your search.
                          </li>
                        ) : (
                          filteredBreeds.map((breed, index) => (
                            <li
                              id={`breed-option-${index}`}
                              key={breed.id}
                              role="option"
                              aria-selected={selectedBreed === breed.name}
                              className={`breed-option${
                                activeIndex === index ? " is-active" : ""
                              }`}
                              onMouseEnter={() => setActiveIndex(index)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectBreed(breed.name)}
                            >
                              {breed.name}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  className="submit-button"
                  type="submit"
                  disabled={!selectedBreed || !currentDog || isSubmitted}
                >
                  Check my answer
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            )}

            {isSubmitted && currentDog && (
              <div>
                <div
                  className={`answer-feedback${isCorrect ? " is-correct" : " is-incorrect"}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="feedback-icon" aria-hidden="true">
                    {isCorrect ? "✔️" : "❌"}
                  </span>
                  <div>
                    <strong>
                      {isCorrect ? "That’s right!" : "Not quite!"}
                    </strong>
                    <p>
                      {isCorrect
                        ? `It's a ${currentDog.breedName}!`
                        : `This pup is a ${currentDog.breedName}. Try another one!`}
                    </p>
                  </div>
                </div>
                <div className="new-dog-row">
                  <button
                    className="new-dog-button"
                    type="button"
                    onClick={loadNewDog}
                    disabled={!currentDog || isLoadingBreeds}
                  >
                    <span aria-hidden="true">↻</span>
                    Next dog
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>Made by Jon</span>
        <span>Photos and breeds from Dog API</span>
      </footer>
    </div>
  );
}
