
// components/outdated/OutdatedBrowserModal.tsx
import React from 'react'

interface OutdatedBrowserModalProps {
  handleCloseModal: () => void;
}

const OutdatedBrowserModal: React.FC<OutdatedBrowserModalProps> = ({ handleCloseModal }) => {
  return (
    <>
    <div className="modal-overlay" id="browserModal">
          <div className="modal-content">
            <h2 className="modal-title">⚠️ Outdated or Unsupported Browser</h2>
            <p className="modal-text">
              Your browser is outdated or missing critical features. Some
              functionality may not work properly.
            </p>

            <div className="recommendation-box">
              <h3 className="recommendation-title">Recommended browsers:</h3>
              <ul className="browser-list">
                <li>Google Chrome 110+</li>
                <li>Mozilla Firefox 100+</li>
                <li>Microsoft Edge 110+</li>
                <li>Safari 15+</li>
              </ul>
            </div>

            <div className="button-container">
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="download-button chrome-button"
              >
                Download Chrome
              </a>
              <a
                href="https://www.mozilla.org/firefox/new/"
                target="_blank"
                rel="noopener noreferrer"
                className="download-button firefox-button"
              >
                Download Firefox
              </a>
              <button onClick={handleCloseModal} className="continue-button">
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
    </>
  )
}

export default OutdatedBrowserModal