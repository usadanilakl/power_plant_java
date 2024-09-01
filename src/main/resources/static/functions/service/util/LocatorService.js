class LocatorService{
    static findParentByTag(element, parentTag) {
        while (element.parentElement) {
          if (element.parentElement.tagName.toLowerCase() === parentTag.toLowerCase()) {
            console.log("Found parent:", element.parentElement);
            return element.parentElement;
          }
          element = element.parentElement;
        }
        console.log("Parent not found");
        return null;
      }
}
export default LocatorService;