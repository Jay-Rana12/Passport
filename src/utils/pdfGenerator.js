const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * Professional PDF Generator with Photo, Signature and QR Code
 */
exports.generateVisaPDF = async (application, user, profile = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            const dirPath = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            const fileName = `VISA_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- HEADER SECTION ---
            doc.rect(0, 0, 612, 120).fill('#0a192f');
            doc.fontSize(26).fillColor('#ffffff').font('Helvetica-Bold').text('BorderBridge Consultancy', 40, 35);
            doc.fontSize(10).fillColor('#ffc107').font('Helvetica').text('PREMIUM VISA & IMMIGRATION SERVICES', 40, 70);

            doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold').text('VISA APPLICATION FORM', 350, 40, { align: 'right' });
            doc.fontSize(10).fillColor('#94a3b8').font('Helvetica').text(`Application No: ${application.applicationId}`, 350, 65, { align: 'right' });
            doc.fontSize(10).fillColor('#94a3b8').text(`Date: ${new Date(application.submissionDate || Date.now()).toLocaleDateString()}`, 350, 80, { align: 'right' });

            doc.moveDown(5);

            // --- QR CODE GENERATION ---
            const qrData = `AppID: ${application.applicationId}\nApplicant: ${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}\nVisa: ${application.visaType}\nStatus: ${application.status}`;
            const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 80 });
            doc.image(qrBuffer, 480, 140, { width: 80 });
            doc.fontSize(7).fillColor('#64748b').text('SCAN TO VERIFY', 480, 225, { width: 80, align: 'center' });

            // --- PHOTO BLOCK ---
            const topY = 140;
            let photoPath = null;
            
            // Try application photo first, then profile photo
            if (application.documents && application.documents.get('applicantPhoto')) {
                photoPath = path.join(__dirname, '../../', application.documents.get('applicantPhoto'));
            } else if (profile && profile.uploads && profile.uploads.get('profilePhoto')) {
                 photoPath = path.join(__dirname, '../../', profile.uploads.get('profilePhoto'));
            }

            if (photoPath && fs.existsSync(photoPath)) {
                doc.image(photoPath, 40, topY, { width: 90, height: 110 });
                doc.rect(40, topY, 90, 110).strokeColor('#e2e8f0').stroke();
            } else {
                doc.rect(40, topY, 90, 110).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
                doc.fontSize(8).fillColor('#94a3b8').text('PHOTO', 40, topY + 50, { width: 90, align: 'center' });
            }

            // Basic Info next to Photo
            doc.fontSize(16).fillColor('#0a192f').font('Helvetica-Bold').text(`${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`, 150, topY);
            doc.fontSize(11).fillColor('#475569').font('Helvetica').text(`Visa Category: ${application.visaType}`);
            doc.text(`Passport No: ${application.passportDetails?.passportNumber || 'N/A'}`);
            doc.text(`Nationality: ${application.applicantDetails?.nationality || 'Indian'}`);
            doc.text(`Status: ${application.status}`);

            doc.moveDown(2);

            // --- FORM SECTIONS ---
            const drawSection = (title, data) => {
                const startY = doc.y;
                doc.rect(40, startY, 532, 25).fill('#f8fafc');
                doc.fontSize(12).fillColor('#0a192f').font('Helvetica-Bold').text(title, 50, startY + 7);
                doc.moveDown(1);
                
                doc.fontSize(10).fillColor('#334155');
                let currentY = doc.y;
                let count = 0;

                Object.entries(data).forEach(([label, value]) => {
                    const x = count % 2 === 0 ? 50 : 320;
                    doc.font('Helvetica-Bold').text(`${label}: `, x, currentY, { continued: true })
                       .font('Helvetica').text(value || 'N/A');
                    
                    if (count % 2 !== 0) currentY = doc.y + 5;
                    count++;
                });
                doc.moveDown(1.5);
            };

            drawSection('Personal Information', {
                'Full Name': `${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`,
                'Date of Birth': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Gender': application.applicantDetails?.gender,
                'Marital Status': application.applicantDetails?.maritalStatus,
                'Email': application.currentAddress?.email,
                'Phone': application.currentAddress?.mobileNumber
            });

            drawSection('Passport Details', {
                'Passport Number': application.passportDetails?.passportNumber,
                'Issuing Authority': application.passportDetails?.issuingAuthority,
                'Date of Issue': application.passportDetails?.issueDate ? new Date(application.passportDetails.issueDate).toLocaleDateString() : 'N/A',
                'Date of Expiry': application.passportDetails?.expiryDate ? new Date(application.passportDetails.expiryDate).toLocaleDateString() : 'N/A'
            });

            drawSection('Travel & Employment', {
                'Destination': application.travelDetails?.destinationCountry,
                'Duration of Stay': (application.travelDetails?.durationOfStay || '30') + ' Days',
                'Purpose': application.travelDetails?.purposeOfVisit,
                'Occupation': application.employmentDetails?.occupation,
                'Monthly Income': '₹' + application.employmentDetails?.monthlyIncome
            });

            drawSection('Address Details', {
                'Street': application.currentAddress?.street,
                'City': application.currentAddress?.city,
                'State': application.currentAddress?.state,
                'Pincode': application.currentAddress?.pincode
            });

            // --- PAYMENT RECEIPT SECTION ---
            doc.rect(40, doc.y, 532, 80).fill('#fffbeb').strokeColor('#fef3c7').stroke();
            doc.fontSize(12).fillColor('#92400e').font('Helvetica-Bold').text('Payment Receipt', 60, doc.y - 70);
            doc.fontSize(10).fillColor('#92400e').font('Helvetica').text('Consultancy Fee Paid:', 60, doc.y + 5, { continued: true }).font('Helvetica-Bold').text(' SUCCESSFUL');
            doc.font('Helvetica').text('Transaction ID: ', 60, doc.y + 5, { continued: true }).font('Helvetica-Bold').text('TXN' + Date.now().toString().slice(-8));
            doc.font('Helvetica').text('Amount Received: ', 60, doc.y + 5, { continued: true }).font('Helvetica-Bold').text('₹2,500.00');

            // --- SIGNATURE SECTION ---
            doc.moveDown(4);
            const sigY = 700;
            
            // Applicant Signature
            let sigPath = null;
            if (application.documents && application.documents.get('applicantSignature')) {
                sigPath = path.join(__dirname, '../../', application.documents.get('applicantSignature'));
            }
            
            if (sigPath && fs.existsSync(sigPath)) {
                doc.image(sigPath, 60, sigY - 50, { width: 120 });
            }
            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, sigY).lineTo(200, sigY).stroke();
            doc.fontSize(9).fillColor('#64748b').text('Applicant Signature', 40, sigY + 5, { width: 160, align: 'center' });

            // Admin Seal
            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(400, sigY).lineTo(560, sigY).stroke();
            doc.fontSize(9).fillColor('#64748b').text('BorderBridge Consultancy Seal', 400, sigY + 5, { width: 160, align: 'center' });

            // Footer
            doc.fontSize(10).fillColor('#0a192f').font('Helvetica-Bold').text('BorderBridge Consultancy me aane ke liye aapka bahut bahut dhanyavad.', 40, 760, { align: 'center' });
            doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('This is an electronically generated acknowledgment for visa application. Please keep this for reference.', 40, 780, { align: 'center' });
            doc.text('BorderBridge Consultancy | support@borderbridge.com', 40, 792, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};

exports.generatePassportPDF = async (application, user, profile = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            const dirPath = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const fileName = `PASS_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- HEADER ---
            doc.rect(0, 0, 612, 120).fill('#064e3b');
            doc.fontSize(26).fillColor('#ffffff').font('Helvetica-Bold').text('BorderBridge Consultancy', 40, 35);
            doc.fontSize(10).fillColor('#10b981').font('Helvetica').text('GOVERNMENT PASSPORT SERVICES PARTNER', 40, 70);

            doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold').text('PASSPORT APPLICATION', 350, 40, { align: 'right' });
            doc.fontSize(10).fillColor('#a7f3d0').font('Helvetica').text(`Reg No: ${application.applicationId}`, 350, 65, { align: 'right' });
            doc.fontSize(10).fillColor('#a7f3d0').text(`Date: ${new Date(application.submissionDate || Date.now()).toLocaleDateString()}`, 350, 80, { align: 'right' });

            // --- QR CODE ---
            const qrData = `Passport App: ${application.applicationId}\nType: ${application.passportType}\nApplicant: ${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`;
            const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 80 });
            doc.image(qrBuffer, 480, 140, { width: 80 });

            // --- PHOTO ---
            const topY = 140;
            let photoPath = null;
            if (application.documents && application.documents.get('applicantPhoto')) {
                photoPath = path.join(__dirname, '../../', application.documents.get('applicantPhoto'));
            }
            
            if (photoPath && fs.existsSync(photoPath)) {
                doc.image(photoPath, 40, topY, { width: 90, height: 110 });
                doc.rect(40, topY, 90, 110).strokeColor('#10b981').stroke();
            } else {
                doc.rect(40, topY, 90, 110).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
            }

            doc.fontSize(16).fillColor('#064e3b').font('Helvetica-Bold').text(`${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`, 150, topY);
            doc.fontSize(11).fillColor('#475569').font('Helvetica').text(`Passport Type: ${application.passportType}`);
            doc.text(`Aadhaar No: ${application.applicantDetails?.aadhaarNumber || 'N/A'}`);
            doc.text(`Submission: ${new Date(application.submissionDate || Date.now()).toLocaleDateString()}`);

            doc.moveDown(2);

            const drawSection = (title, data) => {
                const startY = doc.y;
                doc.rect(40, startY, 532, 25).fill('#f0fdf4');
                doc.fontSize(12).fillColor('#064e3b').font('Helvetica-Bold').text(title, 50, startY + 7);
                doc.moveDown(1);
                doc.fontSize(10).fillColor('#334155');
                let count = 0;
                let currentY = doc.y;
                Object.entries(data).forEach(([label, value]) => {
                    const x = count % 2 === 0 ? 50 : 320;
                    doc.font('Helvetica-Bold').text(`${label}: `, x, currentY, { continued: true }).font('Helvetica').text(value || 'N/A');
                    if (count % 2 !== 0) currentY = doc.y + 5;
                    count++;
                });
                doc.moveDown(1.5);
            };

            drawSection('Personal Details', {
                'Given Name': application.applicantDetails?.givenName,
                'Surname': application.applicantDetails?.surname,
                'DOB': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Place of Birth': application.applicantDetails?.placeOfBirth,
                'Gender': application.applicantDetails?.gender,
                'Marital Status': application.applicantDetails?.maritalStatus
            });

            drawSection('Family Details', {
                'Father Name': application.familyDetails?.fatherName,
                'Mother Name': application.familyDetails?.motherName,
                'Spouse Name': application.familyDetails?.spouseName || 'N/A'
            });

            drawSection('Contact & Address', {
                'Street': application.presentAddress?.street,
                'City/Town': application.presentAddress?.villageTownCity,
                'State': application.presentAddress?.state,
                'Pincode': application.presentAddress?.pincode,
                'Mobile': application.presentAddress?.mobileNumber,
                'Emergency Contact': application.emergencyContact?.name + ' (' + application.emergencyContact?.mobileNumber + ')'
            });

             // Receipt
            doc.rect(40, doc.y, 532, 60).fill('#f0f9ff').strokeColor('#bae6fd').stroke();
            doc.fontSize(11).fillColor('#0369a1').font('Helvetica-Bold').text('Payment & Processing', 60, doc.y - 50);
            doc.fontSize(10).fillColor('#0369a1').font('Helvetica').text('Application Fee: ', 60, doc.y + 5, { continued: true }).font('Helvetica-Bold').text('PAID (₹1,500)');
            doc.font('Helvetica').text('Status: ', 60, doc.y + 5, { continued: true }).font('Helvetica-Bold').text('UNDER REVIEW');

            // SIGNATURE
            doc.moveDown(4);
            const sigY = 720;
            let sigPath = null;
            if (application.documents && application.documents.get('applicantSignature')) {
                sigPath = path.join(__dirname, '../../', application.documents.get('applicantSignature'));
            }
            if (sigPath && fs.existsSync(sigPath)) doc.image(sigPath, 60, sigY - 50, { width: 120 });
            
            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, sigY).lineTo(200, sigY).stroke();
            doc.fontSize(9).fillColor('#64748b').text('Applicant Signature', 40, sigY + 5, { width: 160, align: 'center' });

            // Footer
            doc.fontSize(10).fillColor('#064e3b').font('Helvetica-Bold').text('BorderBridge Consultancy me aane ke liye aapka bahut bahut dhanyavad.', 40, 760, { align: 'center' });
            doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('This is an electronically generated acknowledgment. Please keep this for reference.', 40, 780, { align: 'center' });
            doc.text('BorderBridge Consultancy | support@borderbridge.com', 40, 792, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};
