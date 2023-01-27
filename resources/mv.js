//The algorithm can overall be sped up by also taking into account the LFFs (described in Twists Tilings and Tesellations)

class PotentialCP{ //extends CP?
    //this is the node of a binary tree. the input cp will be the root node.

    //has a parent and up to 2 children: one m and one v.
    //also has an attribute if it's "alive" or not
    //if it has been checked to be alive, create a mountain child. (unless the cp is done)
    //if it has been checked to not be alive, no more children, and tell the parent

    //if it's mountain child is dead, create a valley child.
    //If the valley child also dies, be marked as dead and go up to parent.
    constructor(CP, parent){
        this.index = globalIndex; globalIndex++
        allcps.push(this)
        this.CP = CP //cp object with creases,vertices, faces, etc
        this.parent = parent
        this.children = []
        this.alive = true //"dies" if its not flat foldable, or if both children are dead
    }
    createChild(){
        //we can only have two children because we're only making one decision. There may be more "no brainers" and more
        //faces added if it runs into a section that's already assigned though.
        if(this.children.length == 0){
            var newCreaseMV = 'M'
        } else if (this.children.length ==1){
            var newCreaseMV = 'V'
        } else {throw new Error('cannot create a third child')}

        //create child as identical to parent
        var child = new PotentialCP(structuredClone(this.CP),this)
        this.children.push(child)

        //find which face to target next
        mainloop: for(const assignedFace of child.CP.assignedFaces){
            for(const neighbor of assignedFace.neighbors){
                if(!neighbor.assigned){
                    var newCrease = assignedFace.creases.find(element=>neighbor.creases.includes(element))
                    newCrease.mv = newCreaseMV
                    neighbor.assigned = true
                    child.CP.assignedFaces.push(neighbor)
                    break mainloop
                }
            }
        }
        //look for "no brainers" until nothing changes
        findNoBrainers(newCrease)

        //check again which faces are assigned
        assignFaces(child.CP.faces,child.CP.faces[0])
        child.CP.assignedFaces = []
        child.CP.faces.forEach(element => element.assigned? child.CP.assignedFaces.push(element):null)
        return child
    }
}

function start(input){
    console.log("starting");
    paper.project.clear();
    globalIndex = 0
    allcps = []
    //note: will need to run a split/merge function to clean it up before processing
    inputcp = readCpFile(input);
    displaycp1.clear();
    displaycp1 = displayCp(inputcp,10,50,390,430)

}
function dfs(inputcp){
    //the default way to automatically find one solution
    if(!inputcp.angularFoldable){
        alert("This crease pattern has local flat foldability issues. Please fix the highlighted vertices and try again.")
        return
    }
    inputcp.foldXray(); //already
    //inputcp.displayXray(200,640,380);
    inputcp.findStacks1();
    inputcp.displayStacks(200,640,380);

    //dfs will run a dfs of a binary tree made of PotentialCP until one solution is found
    //it's also running a bfs on a connectivity matrix of the faces. for n faces, we'll store it as an nxn matrix
    //a 0 in spot (i,j) means faces i and j are not connected
    //a
}

function demo(inputcp){
    if(!inputcp.angularFoldable){
        alert("This crease pattern has local flat foldability issues. Please fix the highlighted vertices and try again.")
        return
    }
    inputcp.foldXray(); //already
    try{displayxray.clear()}catch{}
    displayxray = inputcp.displayXray(200,640,380);

    currentcp = new PotentialCP(structuredClone(inputcp),null)

    displaycp2.clear()
    displaycp2 = displayCp(currentcp.CP,410,50,790,430)
    displaycp2.addChild(displayAssignedFaces(currentcp.CP,410,50,790,430))
    

    alert("This is just a placeholder until the built in self intersection detection is working. For now, please look at the crease patterns on the right and see if they have self intersection or not, until it is fully assigned.")

    /*
    if(currentcp.isFlatFoldable){yes(currentcp)} else{no(currentcp)}
    */
}
function yes(currentcp){
    console.log("yes")
    if(currentcp.CP.assignedFaces.length == currentcp.CP.faces.length){
        alert("The cp has been fully assigned")
        return currentcp
    }
    currentcp = currentcp.createChild()    
    //run local flat foldability tests on the child. if the child fails, no(currentcp) and return
    displaycp2.clear()
    displaycp2 = displayCp(currentcp.CP,410,50,790,430)
    displaycp2.addChild(displayAssignedFaces(currentcp.CP,410,50,790,430))
    return currentcp
}

function no(currentcp){
    console.log("no")
    if(currentcp.index == 0) { //alternatively, if currentcp.parent == null
        alert("No solution can be found")
        return currentcp
    }
    currentcp.alive = false
    currentcp = closestAncestor(currentcp)//go up the tree until you find a node who can have a child
    currentcp = currentcp.createChild()

    //run local flat foldability tests on the child. if the child fails, no(currentcp) and return

    displaycp2.clear()
    displaycp2 = displayCp(currentcp.CP,410,50,790,430)
    displaycp2.addChild(displayAssignedFaces(currentcp.CP,410,50,790,430))
    return currentcp
    
}
function closestAncestor(currentcp){
    if((currentcp.alive & currentcp.children.length<2)){
        return currentcp
    }else if (currentcp.parent == null){
        alert("No solution can be found")
        return currentcp
    }else{
        return closestAncestor(currentcp.parent)
    }
}

function assignFaces(faces,startingFace){
    faces.forEach(element => element.assigned = false)
    startingFace.assigned = true
    spread(startingFace)
}
function spread(face){
    for(const neighbor of face.neighbors){
        if((!neighbor.assigned) & ['M','V'].includes(face.creases.find(element=>neighbor.creases.includes(element)).mv)){
            neighbor.assigned = true
            spread(neighbor)
        }
    }
}

function findNoBrainers(crease){
    //look for no brainer vertex on either side of the crease
    //a no brainer is a case where there's one aux left, and we know which way it goes based on the other creases of the vertex
    //recursive, after changing a crease plug that crease in as well
    mainloop: for(const vertex of crease.vertices){
        var M = 0; //these are just counters
        var V = 0;
        var AuxCreases = []; //this will actually store the crease(s) that are aux
        for(const crease of vertex.creases){
            if(crease.mv == 'M'){M+=1}
            if(crease.mv == 'V'){V+=1}
            if(crease.mv == 'A'){AuxCreases.push(crease)}
            if(crease.mv == 'E'){continue mainloop} //doesn't count if its on the edge. unless you're doing big little big lemma
        }
        if(AuxCreases.length == 1){
            //we assume there's an even number of creases, if it's gotten this far
            AuxCreases[0].mv = (V-M == 3)|(M-V==1)?'M':'V'
            findNoBrainers(AuxCreases[0])
        } else {continue mainloop}
    }
}
function displayAssignedFaces(CP,x1,y1,x2,y2){
    var faces = new paper.Group()
    function convertx(cp){
        //Converting cp coords, which range from 0,1, into js coords which range from x1,x2 and y1,y2
        return x1+cp*(x2-x1);
    }
    function converty(cp){
        //also the y coordinates are displayed upside down
        return y1-cp*(y1-y2);
    }

    for(const face of CP.faces){
        if(face.assigned){continue}
        var displayface = new paper.Path();
        for(const vertex of face.vertices){
            displayface.add(new paper.Point(convertx(vertex.x),converty(vertex.y)))
        }
        displayface.closed = true;
        displayface.strokeColor = 'black'
        displayface.opacity = 0.3
        displayface.fillColor = 'black'
        displayface.strokeWidth = 0;
        faces.addChild(displayface)
    }
    /*
    var rootface = new paper.Path();
    for(const vertex of CP.faces[0].vertices){
        rootface.add(new paper.Point(convertx(vertex.x),converty(vertex.y)))
    }
    rootface.closed = true;
    rootface.strokeColor = 'black'
    rootface.opacity = 0.2
    rootface.fillColor = 'green'
    rootface.strokeWidth = 0;
    faces.addChild(rootface)
    */
    return faces
}