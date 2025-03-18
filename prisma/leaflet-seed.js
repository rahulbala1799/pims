"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, adminId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.user.findFirst({
                        where: { role: 'ADMIN' }
                    })];
                case 1:
                    adminUser = _a.sent();
                    if (!adminUser) {
                        console.error('No admin user found. Please run the main seed script first.');
                        process.exit(1);
                    }
                    adminId = adminUser.id;
                    console.log("Using admin user with ID: ".concat(adminId));
                    // Leaflets - A3
                    return [4 /*yield*/, createLeaflet('A3 Leaflet 130gsm', 'LF-A3-130', 'A3 size leaflet on 130gsm paper', 0.036, 'A3 (297x420mm)', 130, null, adminId)];
                case 2:
                    // Leaflets - A3
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A3 Leaflet 170gsm', 'LF-A3-170', 'A3 size leaflet on 170gsm paper', 0.05, 'A3 (297x420mm)', 170, null, adminId)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A3 Leaflet 200gsm', 'LF-A3-200', 'A3 size leaflet on 200gsm paper', 0.07, 'A3 (297x420mm)', 200, null, adminId)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A3 Leaflet 300gsm', 'LF-A3-300', 'A3 size leaflet on 300gsm paper', 0.08, 'A3 (297x420mm)', 300, null, adminId)];
                case 5:
                    _a.sent();
                    // Leaflets - A4
                    return [4 /*yield*/, createLeaflet('A4 Leaflet 130gsm', 'LF-A4-130', 'A4 size leaflet on 130gsm paper', 0.018, 'A4 (210x297mm)', 130, null, adminId)];
                case 6:
                    // Leaflets - A4
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A4 Leaflet 170gsm', 'LF-A4-170', 'A4 size leaflet on 170gsm paper', 0.025, 'A4 (210x297mm)', 170, null, adminId)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A4 Leaflet 200gsm', 'LF-A4-200', 'A4 size leaflet on 200gsm paper', 0.035, 'A4 (210x297mm)', 200, null, adminId)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A4 Leaflet 300gsm', 'LF-A4-300', 'A4 size leaflet on 300gsm paper', 0.04, 'A4 (210x297mm)', 300, null, adminId)];
                case 9:
                    _a.sent();
                    // Leaflets - A5
                    return [4 /*yield*/, createLeaflet('A5 Leaflet 130gsm', 'LF-A5-130', 'A5 size leaflet on 130gsm paper', 0.009, 'A5 (148x210mm)', 130, null, adminId)];
                case 10:
                    // Leaflets - A5
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A5 Leaflet 170gsm', 'LF-A5-170', 'A5 size leaflet on 170gsm paper', 0.0125, 'A5 (148x210mm)', 170, null, adminId)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A5 Leaflet 200gsm', 'LF-A5-200', 'A5 size leaflet on 200gsm paper', 0.0175, 'A5 (148x210mm)', 200, null, adminId)];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A5 Leaflet 300gsm', 'LF-A5-300', 'A5 size leaflet on 300gsm paper', 0.02, 'A5 (148x210mm)', 300, null, adminId)];
                case 13:
                    _a.sent();
                    // Leaflets - A6
                    return [4 /*yield*/, createLeaflet('A6 Leaflet 130gsm', 'LF-A6-130', 'A6 size leaflet on 130gsm paper', 0.0045, 'A6 (105x148mm)', 130, null, adminId)];
                case 14:
                    // Leaflets - A6
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A6 Leaflet 170gsm', 'LF-A6-170', 'A6 size leaflet on 170gsm paper', 0.00625, 'A6 (105x148mm)', 170, null, adminId)];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A6 Leaflet 200gsm', 'LF-A6-200', 'A6 size leaflet on 200gsm paper', 0.00875, 'A6 (105x148mm)', 200, null, adminId)];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A6 Leaflet 300gsm', 'LF-A6-300', 'A6 size leaflet on 300gsm paper', 0.01, 'A6 (105x148mm)', 300, null, adminId)];
                case 17:
                    _a.sent();
                    // Brochures - A4 Tri-fold
                    return [4 /*yield*/, createLeaflet('A4 Tri-fold Brochure 130gsm', 'BR-A4-TF-130', 'A4 tri-fold brochure on 130gsm paper', 0.022, 'A4 (210x297mm)', 130, 'tri-fold', adminId)];
                case 18:
                    // Brochures - A4 Tri-fold
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A4 Tri-fold Brochure 170gsm', 'BR-A4-TF-170', 'A4 tri-fold brochure on 170gsm paper', 0.03, 'A4 (210x297mm)', 170, 'tri-fold', adminId)];
                case 19:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A4 Tri-fold Brochure 200gsm', 'BR-A4-TF-200', 'A4 tri-fold brochure on 200gsm paper', 0.042, 'A4 (210x297mm)', 200, 'tri-fold', adminId)];
                case 20:
                    _a.sent();
                    // Brochures - A4 Z-fold
                    return [4 /*yield*/, createLeaflet('A4 Z-fold Brochure 130gsm', 'BR-A4-ZF-130', 'A4 z-fold brochure on 130gsm paper', 0.022, 'A4 (210x297mm)', 130, 'z-fold', adminId)];
                case 21:
                    // Brochures - A4 Z-fold
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A4 Z-fold Brochure 170gsm', 'BR-A4-ZF-170', 'A4 z-fold brochure on 170gsm paper', 0.03, 'A4 (210x297mm)', 170, 'z-fold', adminId)];
                case 22:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A4 Z-fold Brochure 200gsm', 'BR-A4-ZF-200', 'A4 z-fold brochure on 200gsm paper', 0.042, 'A4 (210x297mm)', 200, 'z-fold', adminId)];
                case 23:
                    _a.sent();
                    // Brochures - A3 Half-fold
                    return [4 /*yield*/, createLeaflet('A3 Half-fold Brochure 130gsm', 'BR-A3-HF-130', 'A3 half-fold brochure on 130gsm paper', 0.043, 'A3 (297x420mm)', 130, 'half-fold', adminId)];
                case 24:
                    // Brochures - A3 Half-fold
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A3 Half-fold Brochure 170gsm', 'BR-A3-HF-170', 'A3 half-fold brochure on 170gsm paper', 0.06, 'A3 (297x420mm)', 170, 'half-fold', adminId)];
                case 25:
                    _a.sent();
                    return [4 /*yield*/, createLeaflet('A3 Half-fold Brochure 200gsm', 'BR-A3-HF-200', 'A3 half-fold brochure on 200gsm paper', 0.084, 'A3 (297x420mm)', 200, 'half-fold', adminId)];
                case 26:
                    _a.sent();
                    console.log('Leaflets and brochures seeded successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
// Helper function to create leaflet or brochure products
function createLeaflet(name, sku, description, basePrice, dimensions, paperWeight, foldType, createdById) {
    return __awaiter(this, void 0, void 0, function () {
        var finishOptions, product, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    finishOptions = ['No coating', 'Gloss coating', 'Matte coating'];
                    return [4 /*yield*/, prisma.product.upsert({
                            where: { sku: sku },
                            update: {
                                name: name,
                                description: description,
                                basePrice: basePrice,
                                dimensions: dimensions,
                                paperWeight: paperWeight,
                                foldType: foldType,
                                finishOptions: finishOptions
                            },
                            create: {
                                name: name,
                                sku: sku,
                                description: description,
                                productClass: client_1.ProductClass.LEAFLETS,
                                basePrice: basePrice,
                                unit: 'per sheet',
                                dimensions: dimensions,
                                material: "".concat(paperWeight, "gsm paper"),
                                finishOptions: finishOptions,
                                minOrderQuantity: 100,
                                leadTime: 3,
                                isActive: true,
                                paperWeight: paperWeight,
                                foldType: foldType,
                                createdById: createdById
                            }
                        })];
                case 1:
                    product = _a.sent();
                    // Create variants for different finishes
                    return [4 /*yield*/, createVariant(product.id, 'Gloss Coating', 'With premium gloss coating', 0.015, createdById)];
                case 2:
                    // Create variants for different finishes
                    _a.sent();
                    return [4 /*yield*/, createVariant(product.id, 'Matte Coating', 'With premium matte coating', 0.018, createdById)];
                case 3:
                    _a.sent();
                    console.log("Created product: ".concat(name, " (").concat(sku, ")"));
                    return [2 /*return*/, product];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error creating ".concat(name, ":"), error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Helper function to create product variants
function createVariant(productId, name, description, priceAdjustment, createdById) {
    return __awaiter(this, void 0, void 0, function () {
        var variant, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.productVariant.create({
                            data: {
                                productId: productId,
                                name: name,
                                description: description,
                                priceAdjustment: priceAdjustment,
                                isActive: true
                            }
                        })];
                case 1:
                    variant = _a.sent();
                    return [2 /*return*/, variant];
                case 2:
                    error_2 = _a.sent();
                    console.error("Error creating variant ".concat(name, ":"), error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
