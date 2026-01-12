Server Side:
1. MarkupItem entity
2. MarkupItem repo
3. Markup mapper
4. Markup service
5. Markup controller

Client side:
1. Markup model
2. Markup mapper
3. Markup table component
4. Markup form component

Relationships:
1. FileObjec has multiple markups
2. One markup can have association with one LotoPoint, LotoPoint will have multiple associations with Equipment or Markups

Flow:
1. File loads, all related markups load ang get placed on its coordinates.
2. user can interact with current items or create new ones 
3. new items can be associated with loto points

The flow is fully mimics Equipment flow:
1. it is associated with a file's specific coordinates
2. it is drawn on a file
3. it is interactive - contex menu, resize, move, delete, associate with loto point...
