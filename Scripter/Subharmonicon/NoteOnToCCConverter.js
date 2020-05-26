/*
 * Copyright (c) 2020 Mario Torre
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
 
/*
 * Simple scipt to translate MIDI Note to Frequency modulator for the Moog Subhamronicon.
 * While we can send MIDI Note On/Off messages, the gate remains open for as long
 * as the note is on; also, when the note is off, the VCO goes back to the frequency defined
 * by the Frequency knob. This script allows to control the VCOs via a MIDI keyboard
 * rather than via CV in.
 */

var VCOCoarse = [
//           C    C#   D    D#   E    F    F#    G    G#   A    A#   B
/* C-2 */    0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
/* C-1 */    0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
/* C0  */    0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0, 
/* C1  */   12,  14,  17,  19,  21,  23,  25,   27,  29,   32,  34,  36,
/* C2  */   38,  40,  42,  44,  46,  49,  51,   53,  55,  57,  59,  61,
/* C3  */   64,  66,  68,  70,  72,  74,  76,   78,  81,  83,  85,  87,
/* C4  */   89,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
/* C5  */    0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
];

var VCOFine = [
//          C    C#   D    D#   E    F    F#    G    G#   A    A#   B
/* C-2 */   0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
/* C-1 */   0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
/* C0  */   0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
/* C1  */ 106, 122,  13,  30,  46,   62,  78,  96, 114,   4,  20,  36,
/* C2  */  52,  70,  88, 104, 121,  10,  28,   44,  61,  79,  97, 111,
/* C3  */   0,  18,  35,  53,  68,  84,  102, 120,   8,  26,  42,  60,
/* C4  */  80,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
/* C5  */   0,   0,   0,   0,   0,   0,   0,    0,   0,   0,   0,   0,
];

var PluginParameters = [
{
    name:"VCO1 Offset", type:"lin", minValue:-63, maxValue:64, numberOfSteps:127, defaultValue:0
},
{
    name:"VCO2 Offset", type:"lin", minValue:-63, maxValue:64, numberOfSteps:127, defaultValue:0
}
];

function HandleMIDI(event) {

    // just drop the NoteOff, we don't need them 
    if (event instanceof NoteOff) {
        return;
    
    } else if (event instanceof NoteOn) {

        var detune1 = GetParameter("VCO1 Offset");
        var detune2 = GetParameter("VCO2 Offset"); 
        
        // NoteOn becomes CCs
        var centerPitch1 = VCOCoarse[event.pitch];
        var fine1 = VCOFine[event.pitch];

        var centerPitch2 = VCOCoarse[event.pitch];
        var fine2 = VCOFine[event.pitch];
        
        // VC0 1
        fine1 = fine1 + detune1
        if (fine1 > 127) {
            fine1 = fine1 - 127;
            centerPitch1 = centerPitch1 + 1;
        } else if (fine1 < 0) {
            fine1 = 127 + fine1;
            centerPitch1 = centerPitch1 - 1;
        }
        var msb = new ControlChange;
        msb.number = 4;
        msb.value = centerPitch1;
        
        var lsb = new ControlChange;
        lsb.number = 36;
        lsb.value = fine1;
                
        // VCO 2
        fine2 = fine2 + detune2
        if (fine2 > 127) {
            fine2 = fine2 - 127;
            centerPitch2 = centerPitch2 + 1;
        } else if (fine2 < 0) {
            fine2 = 127 + fine2;
            centerPitch2 = centerPitch2 - 1;
        }
        var msb2 = new ControlChange;
        msb2.number = 12;
        msb2.value = centerPitch2;
        
        var lsb2 = new ControlChange;
        lsb2.number = 44;
        lsb2.value = fine2;
        
        Trace("msb: " + msb2 + ", lsb: " + lsb2);


        // send the event
        msb.send();
        lsb.send();
        
        msb2.send();
        lsb2.send();
    
    } else {
        // any other event, sent unmodified
        event.send();
    }
}
