const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

/**
 * Professional PDF Generator with Detail Grid (Inspired by Govt. Forms)
 */
exports.generateVisaPDF = async (application, user, profile = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`[PDF] Generating Detailed Visa PDF for ${application.applicationId}`);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            const dirPath = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const fileName = `VISA_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- HEADER ---
            doc.rect(0, 0, 612, 100).fill('#0a192f');
            doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold').text('BorderBridge Consultancy', 40, 32, { width: 280 });
            doc.fontSize(9).fillColor('#ffc107').font('Helvetica').text('PREMIUM VISA & IMMIGRATION SERVICES • SINCE 2026', 40, 62, { width: 280 });

            doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold').text('VISA APPLICATION FORM', 300, 40, { width: 270, align: 'right' });
            doc.fontSize(10).fillColor('#94a3b8').font('Helvetica').text(`ID: ${application.applicationId || 'N/A'}`, 300, 65, { width: 270, align: 'right' });

            doc.fillColor('#000000'); // Reset
            let currentY = 120;

            // --- HERO SECTION (PHOTO & SUMMARY) ---
            try {
                const qrData = `Visa App: ${application.applicationId}\nApplicant: ${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`;
                const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 80 });
                doc.image(qrBuffer, 480, currentY, { width: 80 });
            } catch (err) {}

            let photoPath = application.documents?.get ? application.documents.get('applicantPhoto') : application.documents?.applicantPhoto;
            if (!photoPath && profile?.uploads) photoPath = profile.uploads.get ? profile.uploads.get('profilePhoto') : profile.uploads.profilePhoto;

            if (photoPath) {
                const fullPath = path.isAbsolute(photoPath) ? photoPath : path.join(__dirname, '../../', photoPath);
                if (fs.existsSync(fullPath)) {
                    doc.image(fullPath, 40, currentY, { width: 90, height: 110 });
                    doc.rect(40, currentY, 90, 110).strokeColor('#0a192f').lineWidth(1).stroke();
                }
            } else {
                doc.rect(40, currentY, 90, 110).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
            }

            doc.fontSize(18).fillColor('#0a192f').font('Helvetica-Bold').text(`${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`, 150, currentY + 5);
            doc.fontSize(11).fillColor('#475569').font('Helvetica').text(`Visa Category: ${application.visaType}`, 150, currentY + 30);
            doc.text(`Passport No: ${application.passportDetails?.passportNumber || 'N/A'}`);
            doc.text(`Nationality: ${application.applicantDetails?.nationality || 'Indian'}`);
            doc.text(`Applied On: ${new Date(application.createdAt || Date.now()).toLocaleDateString()}`);

            currentY += 130;

            const drawSectionHeader = (title, y) => {
                doc.rect(40, y, 532, 22).fill('#f1f5f9');
                doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text(title.toUpperCase(), 50, y + 6);
                return y + 32;
            };

            const drawFields = (fields, y) => {
                doc.fontSize(9).fillColor('#334155');
                let count = 0;
                let startY = y;
                Object.entries(fields).forEach(([label, value]) => {
                    const x = count % 2 === 0 ? 50 : 310;
                    doc.font('Helvetica-Bold').text(`${label}: `, x, startY, { continued: true }).font('Helvetica').text(value || '-');
                    if (count % 2 !== 0) startY = doc.y + 6;
                    count++;
                });
                return startY + 15;
            };

            // 1. PERSONAL DETAILS
            currentY = drawSectionHeader('Applicant\'s Personal Details', currentY);
            currentY = drawFields({
                'Full Name': `${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`,
                'Gender': application.applicantDetails?.gender,
                'Date of Birth': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Nationality': application.applicantDetails?.nationality,
                'Prev. Nationality': application.applicantDetails?.previousNationality || 'None',
                'Marital Status': application.applicantDetails?.maritalStatus,
                'National ID': application.applicantDetails?.nationalId || '-',
                'Occupation': application.employmentDetails?.occupation || 'N/A'
            }, currentY);

            // 2. PASSPORT DETAILS
            currentY = drawSectionHeader('Passport & Identity Details', currentY);
            currentY = drawFields({
                'Passport Number': application.passportDetails?.passportNumber,
                'Issuing Authority': application.passportDetails?.issuingAuthority,
                'Place of Issue': application.passportDetails?.placeOfIssue || '-',
                'Issue Date': application.passportDetails?.issueDate ? new Date(application.passportDetails.issueDate).toLocaleDateString() : 'N/A',
                'Expiry Date': application.passportDetails?.expiryDate ? new Date(application.passportDetails.expiryDate).toLocaleDateString() : 'N/A'
            }, currentY);

            // 3. TRAVEL & DESTINATION
            currentY = drawSectionHeader('Travel & Destination Details', currentY);
            currentY = drawFields({
                'Destination': application.travelDetails?.destinationCountry,
                'Expected Arrival': application.travelDetails?.arrivalDate ? new Date(application.travelDetails.arrivalDate).toLocaleDateString() : 'N/A',
                'Expected Departure': application.travelDetails?.departureDate ? new Date(application.travelDetails.departureDate).toLocaleDateString() : 'N/A',
                'Stay Duration': `${application.travelDetails?.durationOfStay || 'N/A'} Days`,
                'Port of Arrival': application.travelDetails?.portOfArrival || '-',
                'Number of Entries': application.travelDetails?.numberOfEntries || 'Single',
                'Purpose of Visit': application.travelDetails?.purposeOfVisit
            }, currentY);

            // 4. ADDRESS & CONTACT
            currentY = drawSectionHeader('Contact Details', currentY);
            currentY = drawFields({
                'Full Address': `${application.currentAddress?.houseNo || ''} ${application.currentAddress?.street || ''}, ${application.currentAddress?.city || ''}`,
                'State': application.currentAddress?.state,
                'PIN Code': application.currentAddress?.pincode,
                'Mobile Number': application.currentAddress?.mobileNumber,
                'Email': application.currentAddress?.email || user?.email
            }, currentY);

            // --- SELF DECLARATION ---
            if (currentY > 600) doc.addPage(), currentY = 50;
            currentY = drawSectionHeader('Self Declaration', currentY);
            doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(
                'I owe allegiance to the sovereignty, unity & integrity of India, and have not voluntarily acquired citizenship of any other country. I have not suppressed any material information and all details provided in this form are true and correct. I am aware that providing false information is a punishable offense under the Passports Act, 1967.',
                50, currentY, { width: 512, align: 'justify', lineGap: 3 }
            );

            // --- SIGNATURE ---
            const sigY = 740;
            let sigPath = application.documents?.get ? application.documents.get('applicantSignature') : application.documents?.applicantSignature;
            if (sigPath) {
                const fullPath = path.isAbsolute(sigPath) ? sigPath : path.join(__dirname, '../../', sigPath);
                if (fs.existsSync(fullPath)) doc.image(fullPath, 60, sigY - 60, { width: 130 });
            }
            doc.strokeColor('#0a192f').lineWidth(1).moveTo(40, sigY).lineTo(220, sigY).stroke();
            doc.fontSize(9).fillColor('#64748b').text('Applicant Digital Signature', 40, sigY + 5, { width: 180, align: 'center' });

            // --- FOOTER ---
            doc.fontSize(10).fillColor('#0a192f').font('Helvetica-Bold').text('BorderBridge Consultancy me aane ke liye aapka bahut bahut dhanyavad.', 40, 785, { align: 'center' });
            doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('This is an electronically generated receipt for your Visa application record. Internal Use Only.', 40, 800, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};

exports.generatePassportPDF = async (application, user, profile = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`[PDF] Generating Detailed Passport PDF for ${application.applicationId}`);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            const dirPath = path.join(__dirname, '../../uploads/pdfs');
            if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

            const fileName = `PASS_${application.applicationId}.pdf`;
            const filePath = path.join(dirPath, fileName);

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- HEADER ---
            doc.rect(0, 0, 612, 100).fill('#064e3b');
            doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold').text('BorderBridge Consultancy', 40, 32, { width: 280 });
            doc.fontSize(9).fillColor('#10b981').font('Helvetica').text('GOVERNMENT PASSPORT SERVICES PARTNER • ISO CERTIFIED', 40, 62, { width: 280 });

            doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold').text('PASSPORT APPLICATION FORM', 300, 40, { width: 270, align: 'right' });
            doc.fontSize(10).fillColor('#a7f3d0').font('Helvetica').text(`REG: ${application.applicationId || 'N/A'}`, 300, 65, { width: 270, align: 'right' });

            doc.fillColor('#000000');
            let currentY = 120;

            // --- HERO SECTION ---
            try {
                const qrData = `Passport App: ${application.applicationId}\nApplicant: ${application.applicantDetails?.givenName}`;
                const qrBuffer = await QRCode.toBuffer(qrData, { margin: 1, width: 80 });
                doc.image(qrBuffer, 480, currentY, { width: 80 });
            } catch (err) {}

            let photoPath = application.documents?.get ? application.documents.get('applicantPhoto') : application.documents?.applicantPhoto;
            if (photoPath) {
                const fullPath = path.isAbsolute(photoPath) ? photoPath : path.join(__dirname, '../../', photoPath);
                if (fs.existsSync(fullPath)) {
                    doc.image(fullPath, 40, currentY, { width: 90, height: 110 });
                    doc.rect(40, currentY, 90, 110).strokeColor('#064e3b').lineWidth(1).stroke();
                }
            } else {
                doc.rect(40, currentY, 90, 110).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
            }

            doc.fontSize(18).fillColor('#064e3b').font('Helvetica-Bold').text(`${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`, 150, currentY + 5);
            doc.fontSize(11).fillColor('#475569').font('Helvetica').text(`Service Type: ${application.passportType}`, 150, currentY + 30);
            doc.text(`Aadhaar No: ${application.applicantDetails?.aadhaarNumber || 'N/A'}`);
            doc.text(`Applied On: ${new Date(application.submissionDate || Date.now()).toLocaleDateString()}`);

            currentY += 130;

            const drawSectionHeader = (title, y) => {
                doc.rect(40, y, 532, 22).fill('#f0fdf4');
                doc.fontSize(11).fillColor('#064e3b').font('Helvetica-Bold').text(title.toUpperCase(), 50, y + 6);
                return y + 32;
            };

            const drawFields = (fields, y) => {
                doc.fontSize(9).fillColor('#334155');
                let count = 0;
                let startY = y;
                Object.entries(fields).forEach(([label, value]) => {
                    const x = count % 2 === 0 ? 50 : 310;
                    doc.font('Helvetica-Bold').text(`${label}: `, x, startY, { continued: true }).font('Helvetica').text(value || '-');
                    if (count % 2 !== 0) startY = doc.y + 6;
                    count++;
                });
                return startY + 15;
            };

            // 1. APPLICANT DETAILS
            currentY = drawSectionHeader('1. Applicant Details', currentY);
            currentY = drawFields({
                'Full Name': `${application.applicantDetails?.givenName} ${application.applicantDetails?.surname}`,
                'Gender': application.applicantDetails?.gender,
                'DOB': application.applicantDetails?.dob ? new Date(application.applicantDetails.dob).toLocaleDateString() : 'N/A',
                'Place of Birth': application.applicantDetails?.placeOfBirth,
                'Birth District': application.applicantDetails?.birthDistrict || '-',
                'Birth State': application.applicantDetails?.birthState || '-',
                'Citizenship By': application.applicantDetails?.citizenshipBy || 'Birth',
                'Marital Status': application.applicantDetails?.maritalStatus,
                'Educational Qual.': application.applicantDetails?.educationalQualification,
                'Employment Type': application.applicantDetails?.employmentType,
                'Voter ID': application.applicantDetails?.voterId || 'N/A',
                'Identity Mark': application.applicantDetails?.visibleMark || 'None'
            }, currentY);

            // 2. FAMILY DETAILS
            currentY = drawSectionHeader('2. Family Details', currentY);
            currentY = drawFields({
                'Father Name': application.familyDetails?.fatherName,
                'Mother Name': application.familyDetails?.motherName,
                'Spouse Name': application.familyDetails?.spouseName || 'N/A',
                'Legal Guardian': application.familyDetails?.legalGuardianName || 'N/A'
            }, currentY);

            // 3. ADDRESS DETAILS
            currentY = drawSectionHeader('3. Residential Address Details', currentY);
            currentY = drawFields({
                'Present Address': `${application.presentAddress?.houseNo || ''} ${application.presentAddress?.street || ''}`,
                'Village/Town/City': application.presentAddress?.villageTownCity,
                'District': application.presentAddress?.district,
                'State': application.presentAddress?.state,
                'PIN Code': application.presentAddress?.pincode,
                'Mobile No': application.presentAddress?.mobileNumber
            }, currentY);

            // 4. SELF DECLARATION
            if (currentY > 600) doc.addPage(), currentY = 50;
            currentY = drawSectionHeader('4. Self Declaration', currentY);
            doc.fontSize(8.5).fillColor('#475569').font('Helvetica').text(
                'I, the undersigned, solemnly declare that I am a citizen of India and have not acquired citizenship of any other country. I have not suppressed any information or provided false details. I am fully aware of the legal consequences of providing incorrect information under the Passports Act, 1967. I hereby authorize the verification of my details for processing this application.',
                50, currentY, { width: 512, align: 'justify', lineGap: 3 }
            );

            // --- SIGNATURE ---
            const sigY = 740;
            let sigPath = application.documents?.get ? application.documents.get('applicantSignature') : application.documents?.applicantSignature;
            if (sigPath) {
                const fullPath = path.isAbsolute(sigPath) ? sigPath : path.join(__dirname, '../../', sigPath);
                if (fs.existsSync(fullPath)) doc.image(fullPath, 60, sigY - 60, { width: 130 });
            }
            doc.strokeColor('#064e3b').lineWidth(1).moveTo(40, sigY).lineTo(220, sigY).stroke();
            doc.fontSize(9).fillColor('#64748b').text('Applicant Signature', 40, sigY + 5, { width: 180, align: 'center' });

            // --- FOOTER ---
            doc.fontSize(10).fillColor('#064e3b').font('Helvetica-Bold').text('BorderBridge Consultancy me aane ke liye aapka bahut bahut dhanyavad.', 40, 785, { align: 'center' });
            doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('This is an electronically generated application form. Original signature and documents may be required during verification.', 40, 800, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve({ filePath, fileName, relativePath: `/uploads/pdfs/${fileName}` }));
            stream.on('error', reject);
        } catch (error) { reject(error); }
    });
};
