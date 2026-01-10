1. replace current tour with diver to custom implementation. 
2. helper button is visible at all times. 
3. helper menu is opelened when button is clicked
4. list of guides and flows is shown
5. when an option is selected from the list of guied - register it globally - and display in little menu so that user can toggle or cancel it at any time
6. every element and component in the app can be associated with multiple guides. 
7. if element is associated with currenttly selected guide - it gets a flashing outline and pulsation and when element is hovered a tooltip with message is shown. 

Conserns: 
1. Should i completely remove diver and stick to just custom implementation? 
2. is it possible to implement guide logic with element highlights in non-invasive way (not change current components) or chane minimally or it is better to set up global pattern for all components for better integration and control? 

Example: 
User is in Home page and selects "Create LOTO Point" guide flow.
LOTO Points card highlights and flushes(flagged). 
User hovers - message shows
User clicks and goes to loto point page
"Create New LOTO point" button in the loto point table is flagged
User clicks on the button, form openes - each form field has tooltip on hover. Also buttons have tooltip. 

