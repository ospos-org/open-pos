declare module 'react-barcode-reader';
//  {
//     export class BarcodeScanner {
//         onScan: Function; // Callback after detection of a successfull scanning (scanned string in parameter)
//         onError: Function; // Callback after detection of a unsuccessfull scanning (scanned string in parameter)
//         onReceive: Function; // Callback after receiving and processing a char (scanned char in parameter)
//         onKeyDetect: Function; // Callback after detecting a keyDown (key char in parameter) - in contrast to onReceive, this fires for non-character keys like tab, arrows, etc. too!
//         timeBeforeScanTest: number; // Wait duration (ms) after keypress event to check if scanning is finished
//         avgTimeByChar: number; // Average time (ms) between 2 chars. Used to do difference between keyboard typing and scanning
//         minLength: number; // Minimum length for a scanning
//         endChar: number[]; // Chars to remove and means end of scanning
//         startChar: number[]; // Chars to remove and means start of scanning
//         scanButtonKeyCode: number; // Key code of the scanner hardware button (if the scanner button a acts as a key itself)
//         scanButtonLongPressThreshold: number; // How many times the hardware button should issue a pressed event before a barcode is read to detect a longpress
//         onScanButtonLongPressed: number; // Callback after detection of a successfull scan while the scan button was pressed and held down
//         stopPropagation: number; // Stop immediate propagation on keypress event
//         preventDefault: number; // Prevent default action on keypress event
//         testCode: string; // Test string for simulating
//     }
// }