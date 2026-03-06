import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { resolveImage } from "./api";

// Helper to convert image URL to Base64
const getBase64ImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/jpeg", 0.8);
            resolve(dataURL);
        };
        img.onerror = (error) => {
            console.error("Error loading image for PDF:", url, error);
            reject(error);
        };
        img.src = url;
    });
};

export const generateTripPDF = async (trip) => {
    console.log("PDF Generation Started for trip:", trip.location);

    if (!trip) {
        console.error("Critical: No trip data provided.");
        return;
    }

    try {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let currY = 20;

        // Formatting helpers
        const formatDate = (dateValue) => {
            if (!dateValue) return "N/A";
            let date;
            if (typeof dateValue === 'object' && dateValue?.$date) {
                date = new Date(dateValue.$date.$numberLong ? parseInt(dateValue.$date.$numberLong) : dateValue.$date);
            } else {
                date = new Date(dateValue);
            }
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        };

        const calculateDuration = () => {
            if (!trip.startDate || !trip.endDate) return "N/A";
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const diffTime = Math.abs(end - start);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        };

        // --- Header ---
        doc.setFontSize(10);
        doc.setTextColor(13, 148, 136); // Teal 600
        doc.setFont("helvetica", "bold");
        doc.text("TRAVEL MEMARIE", margin, currY);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, currY);
        currY += 15;

        // --- Title ---
        doc.setFontSize(26);
        doc.setTextColor(31, 41, 55); // Gray 800
        doc.setFont("helvetica", "bold");
        const location = (trip.location || "Trip").toUpperCase();
        doc.text(location, margin, currY);
        currY += 10;

        // Line
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, currY, pageWidth - margin, currY);
        currY += 10;

        // --- Basic Info Table ---
        autoTable(doc, {
            startY: currY,
            margin: { left: margin },
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 35 } },
            body: [
                ["Date Range", `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`],
                ["Duration", `${calculateDuration()} Days`],
                ["Category", trip.category || "General"],
                ["Budget", `${trip.currency || 'USD'} ${trip.budget || '0'}`],
                ["Status", trip.status || "Completed"]
            ]
        });

        currY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : currY + 40;

        // --- Description ---
        doc.setFontSize(14);
        doc.setTextColor(13, 148, 136);
        doc.setFont("helvetica", "bold");
        doc.text("ABOUT THIS TRIP", margin, currY);
        currY += 7;

        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        doc.setFont("helvetica", "normal");
        const splitDesc = doc.splitTextToSize(trip.description || "No description provided.", pageWidth - (margin * 2));
        doc.text(splitDesc, margin, currY);
        currY += (splitDesc.length * 5) + 15;

        // --- Logistics ---
        if (trip.accommodation || trip.transportation) {
            if (currY > 260) { doc.addPage(); currY = 20; }

            doc.setFontSize(14);
            doc.setTextColor(13, 148, 136);
            doc.setFont("helvetica", "bold");
            doc.text("TRAVEL LOGISTICS", margin, currY);
            currY += 7;

            const logistics = [];
            if (trip.accommodation) logistics.push(["Accommodation", `${trip.accommodation}${trip.accommodationName ? ` (${trip.accommodationName})` : ''}`]);
            if (trip.transportation) logistics.push(["Transportation", trip.transportation]);

            autoTable(doc, {
                startY: currY,
                margin: { left: margin },
                head: [['Category', 'Details']],
                body: logistics,
                headStyles: { fillColor: [240, 253, 250], textColor: [13, 148, 136], fontStyle: 'bold' },
                styles: { fontSize: 9 }
            });
            currY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : currY + 30;
        }

        // --- Highlights ---
        const highlights = Array.isArray(trip.highlights) ? trip.highlights : (typeof trip.highlights === 'string' ? trip.highlights.split(',') : []);
        const cleanHighlights = highlights.filter(h => h && h.trim() !== "");

        if (cleanHighlights.length > 0) {
            if (currY > 240) { doc.addPage(); currY = 20; }

            doc.setFontSize(14);
            doc.setTextColor(13, 148, 136);
            doc.setFont("helvetica", "bold");
            doc.text("TRIP HIGHLIGHTS", margin, currY);
            currY += 7;

            cleanHighlights.forEach(h => {
                doc.setFontSize(10);
                doc.setTextColor(75, 85, 99);
                doc.setFont("helvetica", "normal");
                doc.text(`\u2022 ${h.trim()}`, margin + 5, currY);
                currY += 6;
            });
            currY += 10;
        }

        // --- Culinary ---
        if (trip.foodText || trip.foodImage) {
            if (currY > 220) { doc.addPage(); currY = 20; }

            doc.setFontSize(14);
            doc.setTextColor(13, 148, 136);
            doc.setFont("helvetica", "bold");
            doc.text("CULINARY MEMORIES", margin, currY);
            currY += 7;

            if (trip.foodImage) {
                try {
                    const foodBase64 = await getBase64ImageFromURL(resolveImage(trip.foodImage));
                    doc.addImage(foodBase64, "JPEG", margin, currY, 40, 40, undefined, 'FAST');
                    currY += 45;
                } catch (e) { console.error("Could not add food image to PDF", e); }
            }

            if (trip.foodText) {
                doc.setFontSize(10);
                doc.setTextColor(75, 85, 99);
                doc.setFont("helvetica", "italic");
                const splitFood = doc.splitTextToSize(trip.foodText, pageWidth - (margin * 2));
                doc.text(splitFood, margin, currY);
                currY += (splitFood.length * 5) + 15;
            }
        }

        // --- Memory Gallery ---
        const images = Array.isArray(trip.images) ? trip.images : [];
        if (images.length > 0) {
            if (currY > 200) { doc.addPage(); currY = 20; }

            doc.setFontSize(14);
            doc.setTextColor(13, 148, 136);
            doc.setFont("helvetica", "bold");
            doc.text("MEMORY GALLERY", margin, currY);
            currY += 10;

            const imgWidth = 50;
            const imgHeight = 50;
            const spacing = 5;
            let count = 0;
            const maxImages = 6;

            for (let i = 0; i < images.length && count < maxImages; i++) {
                try {
                    const imgBase64 = await getBase64ImageFromURL(resolveImage(images[i]));
                    const col = count % 3;
                    const row = Math.floor(count / 3);

                    if (row > 0 && col === 0 && (currY + imgHeight + 10) > 280) {
                        doc.addPage();
                        currY = 20;
                    }

                    doc.addImage(imgBase64, "JPEG", margin + (col * (imgWidth + spacing)), currY + (row * (imgHeight + spacing)), imgWidth, imgHeight, undefined, 'FAST');
                    count++;
                } catch (e) {
                    console.error("Skipping image in PDF due to error", images[i], e);
                }
            }
            currY += (Math.ceil(count / 3) * (imgHeight + spacing)) + 10;
        }

        // --- Footer ---
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text("Created with Travel Memarie - Cherish every journey.", pageWidth / 2, 285, { align: "center" });

        // --- Save File ---
        const safeName = String(trip.location || "Trip")
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .toLowerCase();

        const fullFileName = `${safeName}_trip_memory.pdf`;
        console.log("Saving PDF as:", fullFileName);

        doc.save(fullFileName);
        console.log("PDF download triggered.");

    } catch (err) {
        console.error("Error generating PDF:", err);
        alert("Could not generate PDF. Please check the console for errors.");
    }
};
