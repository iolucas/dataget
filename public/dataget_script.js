//Array to store the target element instructions
desiredElementsInstructions = [];

window.onload = function() {

    //Append nav menu to the page
    $("body").append("<div class='dataget-nav-bar'><div class='dataget-nav-bar-title'>PageFrag</div></div>");

    //$(".dataget-nav-bar").append("<button onclick='DatagetCo.setPages();' class='dataget-nav-bar-element'>Done</div>");
    $(".dataget-nav-bar").append("<form action='setpage' method='post'><input type='hidden' value='" + targetPageUrl + "' name='pageUrl'/><input type='hidden' id='dataget-instructions' name='instructions'/><input type='submit' class='dataget-nav-bar-element' value ='Done'/></form>");

    //$(".dataget-nav-bar").append("<div class='dataget-nav-bar-element'>test</div>");

    $(".dataget-selectable")
        .mouseover(function(e) { 
                e.stopPropagation();
                $("dataget-selectable-hover").removeClass("dataget-selectable-hover");
                $(this).addClass("dataget-selectable-hover"); 
        })
        .mouseout(function(e) { 
                e.stopPropagation();
                $(this).removeClass("dataget-selectable-hover"); 
        })
        .click(function(e) {
            e.stopPropagation();

            var targetValue = $(this).text();


            //Get the nearest element with an id

            //Get current element
            var currentElement = $(this);
            var targetElementId;

            var elemStack = [];

            while(true) {
                //Walk the elements tree and stack tags names
                elemStack.push(currentElement.prop("tagName"));

                //Set target element chain class to the current element
                currentElement.addClass("dataget-selectable-target-element-chain");

                //console.log(currentElement);
                //Check if the current element got an id, if so, get it and exit iteration
                /*if(currentElement.attr("id") != undefined) {
                    targetElementId = currentElement.attr("id");
                    break;
                }*/

                //If we reach the top of the tree exit
                if(currentElement.is("html"))
                    break;

                currentElement = currentElement.parent();
            }

            console.log(elemStack);

            //Now we walk down element tree to write the find instructions
            var instructionStack = [];
            var parentElement;

            //If we got a elementId
            if(targetElementId) {
                //Push the id element to the instruction stack
                instructionStack.push("#" + targetElementId);
                //remove the first tag from the elemstack (the element with an id)
                elemStack.pop();
                //Set parent element as the element with id
                parentElement = $(instructionStack[0]);

            } else { //If no id attr were found, set parent as the document (html parent)
                parentElement = $(document);
            }


            //Iterate thru all the tag stack
            while(elemStack.length > 0) {

                var currentTag = elemStack.pop();

                //Flag to avoid unnecessary iteration because the element were already found
                var childrenDone = false;

                parentElement.children(currentTag).each(function(i, rawElem) {
                    if(childrenDone)
                        return;

                    var elem = $(rawElem);

                    //Check if the element has the chain element class
                    if(elem.hasClass("dataget-selectable-target-element-chain")) {
                        //findInstruction += currentTag + '[' + i + '];';
                        instructionStack.push(currentTag + '[' + i + ']');
                        childrenDone = true;
                    }

                    //Update parent element
                    parentElement = elem;
                });

            }

            //Clear all element-chain class
            $('.dataget-selectable-target-element-chain').removeClass("dataget-selectable-target-element-chain");

            var instructionString = instructionStack.join(";");

            console.log(instructionString);

            //Get the current value with the just created instruction
            var returnedTargetValue = getValueByInstruction(instructionString);

            //Compare real value with the retrieved value
            if(targetValue == returnedTargetValue) {
                //If the instruction is valid, add the value to the list
                $(".dataget-nav-bar").append("<div class='dataget-nav-bar-element'>" + returnedTargetValue + "</div>");

                //Append instruction
                desiredElementsInstructions.push(instructionString);

                //Update instruction value on form
                $("#dataget-instructions").val(JSON.stringify(desiredElementsInstructions));

            } else {
                throw "Target element value and generated element value diverged";
            }

            return false;
        });

    console.log("Dataget loaded.");
}

function getValueByInstruction(instruction) {
    var instructionStack = instruction.split(";");

    var parentElement;

    //If the first element is an id, set it as the parentElement and remove it from the list
    if(instructionStack[0].indexOf("#") == 0) {
        parentElement = $(instructionStack.shift());
    } else { //if no id is present, set the parent as the document
        parentElement = $(document);
    }

    while(instructionStack.length > 0) {

        //Decompose instruction and get tagname and index
        var currInstruction = instructionStack.shift().replace("]", "").split("[");

        var tagName = currInstruction[0];
        var tagIndex = currInstruction[1];

        parentElement.children(tagName).each(function(i, rawElem) {
            
            //If the current index is not the tag index, continue the iteration
            if(i != tagIndex)
                return;

            //Update the parent element with the current element
            parentElement = $(rawElem);
        });
    }

    //Get the text of the last parent element
    return parentElement.text();
}