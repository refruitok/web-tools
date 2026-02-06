# Plan for Webpage Markers and Feedback Enhancements

This plan outlines the steps to implement a webpage marking system that integrates with the feedback tab, allowing users to place numbered markers on a page, comment on them, and manage their resolution status via WordPress, with bidirectional jumping between markers and comments.

## 1. Marker Placement & Rendering (Content Script)
- **Implement Marker Placement Mode**: Add logic to `content.js` to listen for a "start-marker-placement" message. When active, clicking on the page captures coordinates.
- **Responsive Positioning**: Store coordinates relative to the document width/center or attach to the nearest stable DOM element to ensure markers stay in the same position on resize. Markers will naturally stay in place on scroll if positioned absolutely relative to `document.body`.
- **Visual Markers**: Create CSS-styled marker elements (circle with number, tooltip).
- **Interactivity (Webpage to Sidepanel)**: Clicking a marker will send a message to the side panel to highlight and scroll to the corresponding comment.
- **Marker Color & Numbering**: Markers will be color-coded and numbered based on the feedback index.

## 2. Feedback Tab UI Enhancements (Side Panel)
- **Add Marker Button**: Add an "Add Marker" button to the `sidepanel.html` feedback tab.
- **Marker Color Selection**: Use colors for easy identification (e.g., user-assigned or random).
- **Updated Feedback List**: Modify the feedback list to display marker numbers and resolution status.
- **Interactivity (Sidepanel to Webpage)**: Clicking a comment item will send a message to the content script to scroll to and highlight the corresponding marker on the page.
- **Resolution & Deletion**: Implement "Resolve" (locks comment, shows user/time) and "Delete" actions.
- **Jump to Comment/Marker**: Implement bidirectional jumping logic.

## 3. WordPress Backend Integration
- **REST API Extensions (`rest.php`)**:
    - Update `POST /feedback` to accept marker coordinates, number, and color.
    - Add `POST /feedback/{id}/resolve` and `DELETE /feedback/{id}` endpoints.
    - Update `GET /feedback` to return marker data and resolution status.
- **Custom Post Type Metadata (`cpt.php` / `admin.php`)**: 
    - Store marker metadata (X, Y, Number, Color, Resolution info).
    - Add columns to the WordPress admin list for status tracking.

## 4. Coordination & State Management
- **User Identification**: Use the logged-in WordPress user's info for markers and resolution.
- **Bidirectional Jumping**: Implement message passing for the "jump to" functionality.
