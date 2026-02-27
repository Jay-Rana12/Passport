const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Professional PDF Generator with Photo and Signature
 */
exports.generateVisaPDF = async (application, user, profile = null) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            const dirPath = path.join(__dirname, '../../public/uploads/pdfs');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const fileName = `VISA_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- HEADER SECTION ---
            doc.rect(0, 0, 612, 100).fill('#0a192f');
            doc.fontSize(28).fillColor('#ffffff').text('BorderBridge', 50, 35, { characterSpacing: 1 });
            doc.fontSize(10).fillColor('#ff8c00').text('INTERNATIONAL TRAVEL SOLUTIONS', 50, 68);

            doc.fontSize(12).fillColor('#ffffff').text('VISA APPLICATION RECEIPT', 350, 45, { align: 'right' });
            doc.fontSize(10).fillColor('#94a3b8').text(`ID: ${application.applicationId}`, 350, 65, { align: 'right' });

            doc.moveDown(5);

            // --- PHOTO & BASIC INFO BLOCK ---
            const topY = 120;

            // Draw Box for Photo if exists
            let photoLoaded = false;
            if (profile && profile.uploads && profile.uploads.profilePhoto) {
                try {
                    const photoPath = path.join(__dirname, '../../', profile.uploads.profilePhoto);
                    if (fs.existsSync(photoPath)) {
                        doc.image(photoPath, 450, topY, { width: 100, height: 120 });
                        doc.rect(450, topY, 100, 120).strokeColor('#e5e7eb').stroke();
                        photoLoaded = true;
                    }
                } catch (e) { console.error('Error loading photo for PDF', e); }
            }

            if (!photoLoaded) {
                doc.rect(450, topY, 100, 120).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
                doc.fontSize(8).fillColor('#94a3b8').text('PHOTO SPACE', 450, topY + 55, { width: 100, align: 'center' });
            }

            doc.fontSize(18).fillColor('#0a192f').text('Applicant Summary', 50, topY);
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#475569');
            doc.text(`Service Type: ${application.visaType} Visa`);
            doc.text(`Submission Date: ${new Date(application.submissionDate || Date.now()).toLocaleDateString()}`);
            doc.text(`Application Status: ${application.status}`);

            doc.moveDown(2);

            // --- DETAILS GRID ---
            const drawSection = (title, data, startY) => {
                doc.fontSize(14).fillColor('#0a192f').text(title, 50, startY);
                doc.moveDown(0.3);
                doc.strokeColor('#ff8c00').lineWidth(2).moveTo(50, doc.y).lineTo(150, doc.y).stroke();
                doc.moveDown(0.8);
                doc.fontSize(10).fillColor('#334155');

                Object.entries(data).forEach(([label, value]) => {
                    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
                        .font('Helvetica').text(value || 'N/A');
                    doc.moveDown(0.2);
                });
                doc.moveDown(1);
            };

            const applicantInfo = {
                'Full Name': application.applicantDetails ? `${application.applicantDetails.givenName} ${application.applicantDetails.surname}` : user.fullName,
                'Nationality': application.applicantDetails?.nationality,
                'Date of Birth': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Passport No.': application.passportDetails?.passportNumber
            };
            drawSection('Applicant Information', applicantInfo, doc.y);

            const travelInfo = {
                'Destination': application.travelDetails?.destinationCountry,
                'Travel Date': application.travelDetails?.travelDate ? new Date(application.travelDetails.travelDate).toLocaleDateString() : 'N/A',
                'Duration': application.travelDetails?.durationOfStay,
                'Purpose': application.travelDetails?.purposeOfVisit
            };
            drawSection('Travel Details', travelInfo, doc.y);

            // --- SIGNATURE SECTION ---
            doc.moveDown(2);
            const sigY = 650;
            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(350, sigY).lineTo(550, sigY).stroke();
            doc.fontSize(10).fillColor('#64748b').text('Authorized Seal / Signature', 350, sigY + 5, { align: 'center' });

            if (profile && profile.uploads && profile.uploads.digitalSignature) {
                try {
                    const sigPath = path.join(__dirname, '../../', profile.uploads.digitalSignature);
                    if (fs.existsSync(sigPath)) {
                        doc.image(sigPath, 375, sigY - 50, { width: 150 });
                    }
                } catch (e) { console.error('Error loading signature for PDF', e); }
            }

            // Footer info
            doc.fontSize(9).fillColor('#94a3b8').text('This is an electronically generated acknowledgment. No physical signature required.', 50, 750, { align: 'center' });
            doc.text('BorderBridge Services | Contact: support@borderbridge.com', 50, 765, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};

exports.generatePassportPDF = async (application, user, profile = null) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            const dirPath = path.join(__dirname, '../../public/uploads/pdfs');
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const fileName = `PASS_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- HEADER ---
            doc.rect(0, 0, 612, 110).fill('#064e3b');
            doc.fontSize(28).fillColor('#ffffff').text('BorderBridge', 50, 35, { characterSpacing: 1 });
            doc.fontSize(10).fillColor('#10b981').text('PASSPORT SERVICES DIVISION', 50, 70);

            doc.fontSize(12).fillColor('#ffffff').text('PASSPORT APPLICATION RECEIPT', 350, 45, { align: 'right' });
            doc.fontSize(10).fillColor('#a7f3d0').text(`REG NO: ${application.applicationId}`, 350, 65, { align: 'right' });

            // --- PHOTO ---
            const topY = 130;
            let photoLoaded = false;
            if (profile && profile.uploads && profile.uploads.profilePhoto) {
                try {
                    const photoPath = path.join(__dirname, '../../', profile.uploads.profilePhoto);
                    if (fs.existsSync(photoPath)) {
                        doc.image(photoPath, 450, topY, { width: 100, height: 120 });
                        doc.rect(450, topY, 100, 120).strokeColor('#10b981').stroke();
                        photoLoaded = true;
                    }
                } catch (e) { console.error('Error loading photo for PDF', e); }
            }
            if (!photoLoaded) {
                doc.rect(450, topY, 100, 120).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
                doc.fontSize(8).fillColor('#94a3b8').text('PHOTO ATTACHED', 450, topY + 55, { width: 100, align: 'center' });
            }

            doc.fontSize(18).fillColor('#064e3b').text('Application Summary', 50, topY);
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#475569');
            doc.text(`Service Type: ${application.passportType} Passport`);
            doc.text(`Date of Submission: ${new Date(application.submissionDate || Date.now()).toLocaleDateString()}`);
            doc.text(`Current Status: ${application.status}`);

            doc.moveDown(2);

            const drawSection = (title, data, startY) => {
                doc.fontSize(14).fillColor('#064e3b').text(title, 50, startY);
                doc.moveDown(0.3);
                doc.strokeColor('#10b981').lineWidth(2).moveTo(50, doc.y).lineTo(150, doc.y).stroke();
                doc.moveDown(0.8);
                doc.fontSize(10).fillColor('#334155');
                Object.entries(data).forEach(([label, value]) => {
                    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value || 'N/A');
                    doc.moveDown(0.2);
                });
                doc.moveDown(1);
            };

            const applicantInfo = {
                'Applicant Full Name': application.applicantDetails ? `${application.applicantDetails.givenName} ${application.applicantDetails.surname}` : user.fullName,
                'Gender': application.applicantDetails?.gender,
                'Birth Date': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Place of Birth': application.applicantDetails?.placeOfBirth
            };
            drawSection('Applicant Profile', applicantInfo, doc.y);

            const serviceInfo = {
                'Police Verification': application.policeVerification?.isRequired,
                'Nearest Station': application.policeVerification?.nearestPoliceStation,
                'Previous Passport No': application.previousPassportDetails?.oldPassportNumber || 'Fresh Application'
            };
            drawSection('Service Information', serviceInfo, doc.y);

            // SIGNATURE
            doc.moveDown(2);
            const sigY = 650;
            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(350, sigY).lineTo(550, sigY).stroke();
            doc.fontSize(10).fillColor('#64748b').text('Authorized Seal / Signature', 350, sigY + 5, { align: 'center' });

            if (profile && profile.uploads && profile.uploads.digitalSignature) {
                try {
                    const sigPath = path.join(__dirname, '../../', profile.uploads.digitalSignature);
                    if (fs.existsSync(sigPath)) doc.image(sigPath, 375, sigY - 50, { width: 150 });
                } catch (e) { console.error('Error loading signature for PDF', e); }
            }

            doc.fontSize(9).fillColor('#94a3b8').text('system generated acknowledgment.', 50, 750, { align: 'center' });
            doc.end();
            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};

