import { jsPDF } from 'jspdf';
import fs from 'fs';

try {
  const doc = new jsPDF();
  doc.text("Hello World", 10, 10);
  const blob = doc.output('blob');
  console.log("Blob size:", blob.size);
  console.log("Blob type:", blob.type);
  
  // Convert blob to arrayBuffer to write to file
  const arrayBuffer = await blob.arrayBuffer();
  fs.writeFileSync('test_blob.pdf', Buffer.from(arrayBuffer));
  console.log("test_blob.pdf written successfully!");
} catch (err) {
  console.error("Error generating PDF:", err);
}
