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
            console.log(`[PDF] Generating Visa PDF for ${application.applicationId}`);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            const dirPath = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const fileName = `VISA_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // HEADER
            doc.rect(0, 0, 612, 120).fill('#0a192f');
            doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold').text('BorderBridge Consultancy', 40, 35);
            doc.fontSize(12).fillColor('#ffc107').font('Helvetica').text('PREMIUM VISA & IMMIGRATION SERVICES', 40, 75);

            doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold').text('VISA APPLICATION FORM', 350, 45, { align: 'right' });
            doc.fontSize(11).fillColor('#94a3b8').font('Helvetica').text(`App No: ${application.applicationId || 'N/A'}`, 350, 70, { align: 'right' });

            // QR
            try {
                const qrData = `Visa App: ${application.applicationId}\nApplicant: ${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`;
                const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 80 });
                doc.image(qrBuffer, 480, 140, { width: 80 });
            } catch (err) {}

            // PHOTO
            const topY = 140;
            let photoPath = application.documents?.get ? application.documents.get('applicantPhoto') : application.documents?.applicantPhoto;
            if (!photoPath && profile?.uploads) photoPath = profile.uploads.get ? profile.uploads.get('profilePhoto') : profile.uploads.profilePhoto;

            if (photoPath) {
                const fullPath = path.isAbsolute(photoPath) ? photoPath : path.join(__dirname, '../../', photoPath);
                if (fs.existsSync(fullPath)) {
                    doc.image(fullPath, 40, topY, { width: 100, height: 120 });
                    doc.rect(40, topY, 100, 120).strokeColor('#0a192f').lineWidth(1).stroke();
                }
            } else {
                doc.rect(40, topY, 100, 120).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
            }

            // INFO
            doc.fontSize(20).fillColor('#0a192f').font('Helvetica-Bold').text(`${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`, 160, topY + 5);
            doc.fontSize(13).fillColor('#475569').font('Helvetica').text(`Visa Category: ${application.visaType}`, 160, topY + 35);
            doc.text(`Passport No: ${application.passportDetails?.passportNumber || 'N/A'}`);
            doc.text(`Nationality: ${application.applicantDetails?.nationality || 'Indian'}`);

            doc.moveDown(4);

            const drawSection = (title, data) => {
                if (doc.y > 650) doc.addPage();
                const currentY = doc.y;
                doc.rect(40, currentY, 532, 28).fill('#f8fafc');
                doc.fontSize(14).fillColor('#0a192f').font('Helvetica-Bold').text(title, 50, currentY + 7);
                doc.moveDown(1);
                
                doc.fontSize(11).fillColor('#334155');
                let count = 0;
                let rowY = doc.y;
                Object.entries(data).forEach(([label, value]) => {
                    const x = count % 2 === 0 ? 50 : 310;
                    doc.font('Helvetica-Bold').text(`${label}: `, x, rowY, { continued: true }).font('Helvetica').text(value || 'N/A');
                    if (count % 2 !== 0) rowY = doc.y + 8;
                    count++;
                });
                doc.moveDown(2);
            };

            drawSection('Personal Details', {
                'Full Name': `${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`,
                'DOB': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Gender': application.applicantDetails?.gender,
                'Email': application.currentAddress?.email || user?.email,
                'Phone': application.currentAddress?.mobileNumber || user?.phone,
                'Marital Status': application.applicantDetails?.maritalStatus
            });

            drawSection('Passport & Travel', {
                'Passport Number': application.passportDetails?.passportNumber,
                'Issuing Authority': application.passportDetails?.issuingAuthority,
                'Travel Destination': application.travelDetails?.destinationCountry,
                'Purpose of Visit': application.travelDetails?.purposeOfVisit,
                'Duration of Stay': application.travelDetails?.durationOfStay + ' Days'
            });

            // SIGNATURE
            const sigY = 720;
            let sigPath = application.documents?.get ? application.documents.get('applicantSignature') : application.documents?.applicantSignature;
            if (sigPath) {
                const fullPath = path.isAbsolute(sigPath) ? sigPath : path.join(__dirname, '../../', sigPath);
                if (fs.existsSync(fullPath)) doc.image(fullPath, 60, sigY - 50, { width: 140 });
            }
            doc.strokeColor('#0a192f').lineWidth(1).moveTo(40, sigY).lineTo(220, sigY).stroke();
            doc.fontSize(10).fillColor('#64748b').text('Applicant Signature', 40, sigY + 5, { width: 180, align: 'center' });

            // FOOTER
            doc.fontSize(11).fillColor('#0a192f').font('Helvetica-Bold').text('BorderBridge Consultancy me aane ke liye aapka bahut bahut dhanyavad.', 40, 770, { align: 'center' });
            doc.fontSize(9).fillColor('#94a3b8').font('Helvetica').text('This is an electronically generated document. Please keep it for your records.', 40, 790, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};

exports.generatePassportPDF = async (application, user, profile = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`[PDF] Generating Passport PDF for ${application.applicationId}`);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            const dirPath = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const fileName = `PASS_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // HEADER
            doc.rect(0, 0, 612, 120).fill('#064e3b');
            doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold').text('BorderBridge Consultancy', 40, 35);
            doc.fontSize(12).fillColor('#10b981').font('Helvetica').text('GOVERNMENT PASSPORT SERVICES PARTNER', 40, 75);

            doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold').text('PASSPORT APPLICATION FORM', 350, 45, { align: 'right' });
            doc.fontSize(11).fillColor('#a7f3d0').font('Helvetica').text(`Reg No: ${application.applicationId || 'N/A'}`, 350, 70, { align: 'right' });

            // QR
            try {
                const qrData = `Passport App: ${application.applicationId}\nType: ${application.passportType}\nApplicant: ${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`;
                const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 80 });
                doc.image(qrBuffer, 480, 140, { width: 80 });
            } catch (err) {}

            // PHOTO
            const topY = 140;
            let photoPath = application.documents?.get ? application.documents.get('applicantPhoto') : application.documents?.applicantPhoto;
            if (photoPath) {
                const fullPath = path.isAbsolute(photoPath) ? photoPath : path.join(__dirname, '../../', photoPath);
                if (fs.existsSync(fullPath)) {
                    doc.image(fullPath, 40, topY, { width: 100, height: 120 });
                    doc.rect(40, topY, 100, 120).strokeColor('#064e3b').lineWidth(1).stroke();
                }
            } else {
                doc.rect(40, topY, 100, 120).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
            }

            // INFO
            doc.fontSize(22).fillColor('#064e3b').font('Helvetica-Bold').text(`${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`, 160, topY + 5);
            doc.fontSize(14).fillColor('#475569').font('Helvetica').text(`Service Type: ${application.passportType}`, 160, topY + 40);
            doc.text(`Aadhaar No: ${application.applicantDetails?.aadhaarNumber || 'N/A'}`);
            doc.text(`Date of App: ${new Date(application.submissionDate || Date.now()).toLocaleDateString()}`);

            doc.moveDown(4);

            const drawSection = (title, data) => {
                if (doc.y > 650) doc.addPage();
                const currentY = doc.y;
                doc.rect(40, currentY, 532, 28).fill('#f0fdf4');
                doc.fontSize(14).fillColor('#064e3b').font('Helvetica-Bold').text(title, 50, currentY + 7);
                doc.moveDown(1);
                
                doc.fontSize(12).fillColor('#334155');
                let count = 0;
                let rowY = doc.y;
                Object.entries(data).forEach(([label, value]) => {
                    const x = count % 2 === 0 ? 50 : 310;
                    doc.font('Helvetica-Bold').text(`${label}: `, x, rowY, { continued: true }).font('Helvetica').text(value || 'N/A');
                    if (count % 2 !== 0) rowY = doc.y + 8;
                    count++;
                });
                doc.moveDown(2);
            };

            // SECTIONS
            drawSection('Applicant Details', {
                'Full Name': `${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`,
                'Gender': application.applicantDetails?.gender,
                'DOB': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Place of Birth': application.applicantDetails?.placeOfBirth,
                'Marital Status': application.applicantDetails?.maritalStatus,
                'Nationality': application.applicantDetails?.nationality || 'Indian',
                'Educational Qual.': application.applicantDetails?.educationalQualification,
                'Employment Type': application.applicantDetails?.employmentType
            });

            drawSection('Family & Guardian Details', {
                'Father Name': application.familyDetails?.fatherName,
                'Mother Name': application.familyDetails?.motherName,
                'Legal Guardian': application.familyDetails?.legalGuardianName || 'N/A',
                'Spouse Name': application.familyDetails?.spouseName || 'N/A'
            });

            drawSection('Address & Contact', {
                'Present Address': `${application.presentAddress?.houseNo || ''} ${application.presentAddress?.street}, ${application.presentAddress?.villageTownCity}`,
                'Police Station': application.presentAddress?.policeStation,
                'District': application.presentAddress?.district,
                'State': application.presentAddress?.state,
                'PIN Code': application.presentAddress?.pincode,
                'Mobile Number': application.presentAddress?.mobileNumber,
                'Email Address': application.presentAddress?.email
            });

            // Conditional Sections based on Passport Type
            if (application.passportType === 'Renewal') {
                drawSection('Renewal Details', {
                    'Old Passport No': application.previousPassportDetails?.oldPassportNumber,
                    'Issue Date': application.previousPassportDetails?.issueDate ? new Date(application.previousPassportDetails.issueDate).toLocaleDateString() : 'N/A',
                    'Renewal Reason': application.renewalDetails?.reason,
                    'Updates Requested': application.renewalDetails?.updateRequired?.join(', ') || 'None'
                });
            }

            if (application.passportType === 'Correction') {
                drawSection('Correction Details', {
                    'Correction In': application.correctionDetails?.correctionType?.join(', '),
                    'Other Details': application.correctionDetails?.details
                });
            }

            if (application.passportType === 'Lost/Reissue') {
                drawSection('Lost/Reissue Details', {
                    'FIR Number': application.lostDetails?.firNumber,
                    'FIR Date': application.lostDetails?.firDate ? new Date(application.lostDetails.firDate).toLocaleDateString() : 'N/A',
                    'Loss Location': application.lostDetails?.lossLocation,
                    'Lost Details': application.lostDetails?.lossDetails
                });
            }

            if (application.passportType === 'Minor') {
                drawSection('Minor Information', {
                    'Father Consent': application.minorDetails?.fatherConsent ? 'Yes' : 'No',
                    'Mother Consent': application.minorDetails?.motherConsent ? 'Yes' : 'No',
                    'School ID Provided': application.minorDetails?.schoolId ? 'Yes' : 'No'
                });
            }

            // SIGNATURE
            const sigY = 720;
            let sigPath = application.documents?.get ? application.documents.get('applicantSignature') : application.documents?.applicantSignature;
            if (sigPath) {
                const fullPath = path.isAbsolute(sigPath) ? sigPath : path.join(__dirname, '../../', sigPath);
                if (fs.existsSync(fullPath)) doc.image(fullPath, 60, sigY - 50, { width: 140 });
            }
            doc.strokeColor('#064e3b').lineWidth(1).moveTo(40, sigY).lineTo(220, sigY).stroke();
            doc.fontSize(10).fillColor('#64748b').text('Applicant Signature', 40, sigY + 5, { width: 180, align: 'center' });

            // FOOTER
            doc.fontSize(11).fillColor('#064e3b').font('Helvetica-Bold').text('BorderBridge Consultancy me aane ke liye aapka bahut bahut dhanyavad.', 40, 770, { align: 'center' });
            doc.fontSize(9).fillColor('#94a3b8').font('Helvetica').text('This is an electronically generated acknowledgment for passport application. Please keep this for reference.', 40, 790, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};
