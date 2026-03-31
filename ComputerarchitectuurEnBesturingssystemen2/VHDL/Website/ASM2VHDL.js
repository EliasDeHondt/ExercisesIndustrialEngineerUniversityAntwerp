// this script is only tested on Google Chrome browser
// please report any bugs to: koen.lostrie@telenet.be
//

// global variables
// a list of all assembler instructions with their respective machine code
// every X will be converted to 0 automatically
// every K, M and A has to be provided by the user in hex format
const defAsmCodes = [
  ['LOAD ACC'   , 'KK' , '0000XXXXKKKKKKKK'],
  ['AND ACC'    , 'KK' , '0001XXXXKKKKKKKK'],
  ['ADD ACC'    , 'KK' , '00100XXXKKKKKKKK'],
  ['ADD IND'    , 'MM' , '00101XXXMMMMMMMM'],
  ['SUB ACC'    , 'KK' , '0011XXXXKKKKKKKK'],
  ['READ MEM'   , 'MM' , '0100XXXXMMMMMMMM'],
  ['WRITE MEM'  , 'MM' , '0101XXXXMMMMMMMM'],
  ['INPUT ACC'  , ''   , '0110XXXXXXXXXXXX'],
  ['OUTPUT ACC' , ''   , '0111XXXXXXXXXXXX'],
  ['JUMP U'     , 'AA' , '1000XXXXAAAAAAAA'],
  ['JUMP Z'     , 'AA' , '100100XXAAAAAAAA'],
  ['JUMP C'     , 'AA' , '100110XXAAAAAAAA'],
  ['JUMP NZ'    , 'AA' , '100101XXAAAAAAAA'],
  ['JUMP NC'    , 'AA' , '100111XXAAAAAAAA'],
  ['JUMP IND'   , 'MM' , '1011XXXXMMMMMMMM'],
  ['BITOR ACC'  , 'KK' , '1100XXXXKKKKKKKK'],
  ['BITORZ ACC' , 'KK' , '1101XXXXKKKKKKKK']];
var asmCodes = defAsmCodes; // can be overwritten by a load
var asmTable;
var instructionTable;
var vhdlTable;
var docBgColor = '#005b88';
var instrBgColor = '#CCCC00';
var asmBgColor = '#CCCC00';
var opcodeEmptyColor = '#FF6600';
var cursor = 0; // cursor position in the ASM table
var isHex = /^[0-9A-Fa-f]{2}$/; // check if string is a hex value
var insertMode = false; // for inserting instructions at the cursor instead of the end
var insModeDiv;
var loadText; // contains the file contents of selected ASM file
const saveHeader1 = "# This ASM2VHDL save file was automatically generated on ";
const saveHeader2 = "# Manual changes may result in loss of your program.";
const saveInstr = "# Available instructions:";
const saveProg = "# ASM program:";

// main function, called from HTML body
function startScripts() {
  var row;
  var cell;
  asmTable = document.getElementById('asmTable');
  instructionTable = document.getElementById('instructionTable');
  vhdlTable = document.getElementById('vhdlTable');
  insModeDiv = document.getElementById('insMode');
  document.body.bgColor = docBgColor;

  // fill the instructionTable with all available instructions in asmCodes
  for (r=0;r<asmCodes.length;r++) {
    row = instructionTable.insertRow(-1);
    cell = row.insertCell(0);
    cell.innerHTML = asmCodes[r][0];
    cell.style.backgroundColor = instrBgColor;
    cell.setAttribute('onclick','addInstr('+r+');');
  }
}

// add the instruction from row 'index' in instructionTable to the asmTable at cursor position
function addInstr(index) {
  var row;
  var cell;
  var input;
  row = asmTable.insertRow(cursor);
  row.addEventListener('mouseover', updateCursor);
  row.addEventListener('mouseout', mouseLeftAsmTable);
  row.addEventListener('contextmenu', insertModeOn);
  // an invisible cell with the index of the instruction (for easy conversion further on)
  cell = row.insertCell(0);
  cell.innerHTML = index;
  cell.style.visibility = 'hidden';
  //  the address of the instruction (in hex)
  cell = row.insertCell(-1); 
  cell.innerHTML = '0x'+('00'+row.rowIndex.toString(16).toUpperCase()).slice(-2);
  cell.style.backgroundColor = asmBgColor;
  // the ASM instruction
  cell = row.insertCell(-1); 
  cell.innerHTML = asmCodes[index][0];
  cell.style.backgroundColor = asmBgColor;
  // the opcode of the instruction (if applicable)
  if (asmCodes[index][1] != '') {
    cell = row.insertCell(-1); 
    cell.innerHTML = '0x';
    input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 2;
    input.size = 2;
    input.value = asmCodes[index][1];
    input.style.backgroundColor = opcodeEmptyColor;
    input.onchange=checkOpcode;
    cell.append(input);
  } else {
    cell.colSpan = '2';
  }
  cell = row.insertCell(-1);
  cell.innerHTML = '<img src="trashbin.gif" width="15">';
  cell.onclick = removeInstruction;
  updateInstrAddrs();
  cursor++;
}

function updateInstrAddrs(){
  var r;
  for (r=0;r<asmTable.rows.length;r++) {
    asmTable.rows[r].cells[1].innerHTML = '0x'+('00'+r.toString(16).toUpperCase()).slice(-2);
  }
}

function removeInstruction(evt) {
  var row = evt.target.parentNode;
  var lvl=0;
  // find the current table row
  while ((row.nodeName != "TR") && (lvl < 4)) {
    row = row.parentNode;
    lvl++;
  }
  if (row.nodeName != "TR"){
    alert ("Oeps. Je hebt ergens geklikt waar ik het niet verwacht had. Het kan zijn dat je de pagina opnieuw moet laden (DEBUG:"+row.nodeName+").");
  }
  if (cursor > row.rowIndex) cursor--;
  row.remove();
  updateInstrAddrs();
}

// change the background color if the opcode is a hex number
function checkOpcode(evt) {
  var input = evt.target;
  if (isHex.test(input.value)) {
    input.style.backgroundColor = asmBgColor;
  } else {
    input.style.backgroundColor = opcodeEmptyColor;
  }
}

function convertASM() {
  var instrIndex;
  var binCode;
  var cell = vhdlTable.rows[0].cells[0];
  var opcode;
  cell.innerHTML = '';
  // convert every entry in ASM table to VHDL
  for (r=0;r<asmTable.rows.length;r++) {
    cell.innerHTML += '16#'+asmTable.rows[r].cells[1].innerHTML.slice(-2)+'# => ';
    instrIndex = asmTable.rows[r].cells[0].innerHTML;
    binCode = asmCodes[instrIndex][2];
    binCode = binCode.replace(/X/g,'0');
    binCode = binCode.replace(/[KMA]/g,'');
    cell.innerHTML += '"' + binCode;
    opcode = asmTable.rows[r].cells[3].getElementsByTagName('input')[0];
    if (opcode === undefined) {
      cell.innerHTML += '", -- ' + asmCodes[instrIndex][0] + '<br>';
    } else {
      if (isHex.test(opcode.value)) {
        cell.innerHTML += ('00000000' + parseInt(opcode.value,16).toString(2)).slice(-8);
      } else {
        cell.innerHTML += 'UUUUUUUU';
      }
      cell.innerHTML += '", -- ' + asmCodes[instrIndex][0] + ' 0x' + opcode.value + '<br>';
    }
  }
}

function updateCursor(evt) {
  var object = evt.target.parentNode;
  if (object.nodeName == 'TR') {
    cursor = object.rowIndex;
    drawCursor();
  }
}

function drawCursor() {
  for (r=0;r<asmTable.rows.length;r++) {
    asmTable.rows[r].style.borderTop = '0px';
  }
  asmTable.rows[cursor].style.borderTop = '3px solid blue';
}

function mouseLeftAsmTable() {
  if (!insertMode) {
    cursor = asmTable.rows.length;
    for (r=0;r<asmTable.rows.length;r++) {
      asmTable.rows[r].style.borderTop = '0px';
    }
  }
}

function insertModeOn(evt) {
  evt.preventDefault();
  if (insertMode) {
    insertMode = false;
    insModeDiv.innerHTML = 'currently <strong><font color="black">OFF</font></strong>';
  } else {
    insertMode = true;
    insModeDiv.innerHTML = 'currently <strong><font color="blue">ON</font></strong>';
  }
}

function copyASM() {
  var saveText = saveHeader1 + Date() + "\n" + saveHeader2 + "\n";
  saveText += saveInstr + "\n";
  asmTable = document.getElementById('asmTable');
  var index;

  // Go over every available instruction in asmCodes
  for (var r=0;r<asmCodes.length;r++) {
    saveText += asmCodes[r][0] + ";"; // ASM operand
    saveText += asmCodes[r][1] + ";"; // ASM opcode
    saveText += asmCodes[r][2] + "\n"; // machine language
  }
  saveText += saveProg + "\n";
  for (var r=0;r<asmTable.rows.length;r++) {
    index = asmTable.rows[r].cells[0].innerHTML; // instruction index
    saveText += index + ";";
    opcode = asmTable.rows[r].cells[3].getElementsByTagName('input')[0];
    if (opcode === undefined) {
      saveText += "NA\n"; // opcode not applicable
    } else {
      saveText += opcode.value + "\n"; // opcode 
    }
  }
  navigator.clipboard.writeText(saveText);
}

function loadASM() {
  const [fileSelector] = document.getElementById('loadButton').files;
  const reader = new FileReader();
  reader.addEventListener( "load", () => { loadText=reader.result; }, false,);
  if (fileSelector) { objectName = fileSelector.name; reader.readAsText(fileSelector); }

  // What will be executed after the file has been loaded:
  reader.onloadend = () => {
    var lines = loadText.split("\n");
    var line, fields, opcode, instrRow, row, cell, tableLen;
    var readState = "header"; // can be "header", "instructions" or "program"
    // Check if there are at least 3 lines in the file
    if (lines.length < 3) {
      abortLoad(fileSelector.name);
      return 0;
    }
    // Check if the header is correct
    if ((lines[0].substring(0,saveHeader1.length) != saveHeader1) ||
        (lines[1].substring(0,saveHeader2.length) != saveHeader2)) {
      abortLoad(fileSelector.name);
      return 0;
    }
    // Go over every line in the file
    for (var l=2;l<lines.length;l++) {
      line = lines[l].trim();
      if (readState == "header") { // the header part of the file
        // Search for the start of the available instructions
        if (line.substring(0,saveInstr.length) == saveInstr) {
          readState = "instructions";
          instrRow = 0;
          asmCodes = []; // clear the available instructions
          // clear the instruction table
          tableLen = instructionTable.rows.length;
          for (var r=0;r<tableLen;r++) {
            instructionTable.deleteRow(0);
          }
        }
      } else if (readState == "instructions") { // the available instructions part of the file
        if (line.substring(0,saveProg.length) == saveProg) { // Check if the program part is starting
          readState = "program";
          // clear the ASM program
          tableLen = asmTable.rows.length;
          for (var r=0;r<tableLen;r++) {
            asmTable.deleteRow(0);
          }
          cursor = 0; // set the cursor at the first line
        } else { // add an available instruction
          fields = line.split(";");
          if (fields.length != 3) {
            abortLoad(fileSelector.name,l+1);
            return 0;
          }
          asmCodes.push([fields[0],fields[1],fields[2]]);
          // add the instruction to the instructionTable
          row = instructionTable.insertRow(-1);
          cell = row.insertCell(0);
          cell.innerHTML = asmCodes[instrRow][0];
          cell.style.backgroundColor = instrBgColor;
          cell.setAttribute('onclick','addInstr('+instrRow+');');
          instrRow++;
        }
      } else if (readState == "program") { // the ASM program part of the file
        fields = line.split(";");
        if (fields.length != 2) {
          abortLoad(fileSelector.name,l+1);
          return 0;
        }
        addInstr(fields[0]);
        if (fields[1] != "NA") { // add opcode
          opcode = asmTable.rows[asmTable.rows.length-1].cells[3].getElementsByTagName('input')[0];
          opcode.value = fields[1];
          opcode.dispatchEvent(new Event('change'));
        }
      }
    }
  }
}

function abortLoad(filename,linenum = 0) {
  if (linenum == 0) {
    alert ("File " + filename + " is of wrong format. Aborting...");
  } else {
    alert ("Line " + linenum + " of file " + filename + " is of wrong format. Aborting...");
  }
  asmCodes = defAsmCodes.slice(); // copy by value, not reference
}