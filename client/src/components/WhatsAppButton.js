import React from 'react';
import './WhatsAppButton.css';

const PHONE_NUMBER = '923088881186'; // Replace with your actual WhatsApp number (country code + number, no + or spaces)

const WhatsAppButton = () => (
  <a
    id="whatsapp-floating-btn"
    href={`https://wa.me/${PHONE_NUMBER}`}
    target="_blank"
    rel="noopener noreferrer"
    className="whatsapp-float"
    aria-label="Chat on WhatsApp"
  >
    {/* Official WhatsApp SVG icon */}
    <svg
      className="whatsapp-float__icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
    >
      <path d="M16.004 0C7.165 0 .003 7.16.003 15.997a15.92 15.92 0 0 0 2.46 8.533L.015 32l7.728-2.41a15.94 15.94 0 0 0 8.26 2.297h.001C24.843 31.887 32 24.727 32 15.997 32 7.16 24.843 0 16.004 0Zm0 29.29a13.34 13.34 0 0 1-7.262-2.138l-.52-.31-4.583 1.43 1.455-4.466-.34-.542A13.3 13.3 0 0 1 2.6 15.997C2.6 8.597 8.6 2.598 16.004 2.598 23.4 2.598 29.4 8.597 29.4 15.997c0 7.407-5.993 13.293-13.396 13.293Zm7.322-9.953c-.4-.2-2.37-1.17-2.738-1.302-.367-.134-.635-.2-.903.2-.267.4-1.035 1.302-1.27 1.57-.234.267-.468.3-.868.1-.4-.2-1.69-.623-3.218-1.988-1.19-1.062-1.993-2.373-2.227-2.773-.234-.4-.025-.616.176-.815.18-.18.4-.468.6-.702.2-.234.267-.4.4-.668.134-.267.067-.5-.033-.702-.1-.2-.903-2.176-1.237-2.98-.326-.783-.657-.677-.903-.69-.234-.01-.5-.013-.768-.013a1.474 1.474 0 0 0-1.07.5c-.367.4-1.403 1.37-1.403 3.342 0 1.973 1.436 3.878 1.636 4.146.2.267 2.826 4.314 6.85 6.048.957.413 1.703.66 2.285.845.96.305 1.834.262 2.525.159.77-.115 2.37-.97 2.705-1.905.334-.935.334-1.737.234-1.905-.1-.167-.367-.267-.768-.467Z" />
    </svg>

    {/* Pulse ring animation */}
    <span className="whatsapp-float__pulse" />
  </a>
);

export default WhatsAppButton;
