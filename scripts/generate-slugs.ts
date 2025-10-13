/**
 * Script de migración para generar slugs desde el metaTitle del SEO
 *
 * Este script:
 * 1. Lee todos los documentos SEO de la base de datos
 * 2. Genera un slug desde el metaTitle
 * 3. Actualiza la entidad correspondiente con el slug generado
 *
 * Uso: npm run generate-slugs
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno - intentar .env.local primero, luego .env
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ No se encontró archivo .env o .env.local');
  process.exit(1);
}

// Función local para generar slugs (evita dependencia circular)
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .replace(/[^a-z0-9]+/g, "-") // Reemplaza caracteres especiales con guiones
    .replace(/^-+|-+$/g, ""); // Elimina guiones al inicio y final
}

// Importaciones después de dotenv
const { connectDB } = require('../lib/mongodb');
const { SEO } = require('../models/SEO');
const Classes = require('../models/Classes').default;
const Location = require('../models/Locations').default;
const OnlineCourse = require('../models/OnlineCourses').default;

async function generateSlugsFromSEO() {
  try {
    console.log('🚀 Conectando a la base de datos...');
    await connectDB();

    console.log('📊 Obteniendo datos SEO...');
    const seoDocuments = await SEO.find({
      entityId: { $ne: null },
      metaTitle: { $exists: true, $ne: '' }
    });

    console.log(`✅ Encontrados ${seoDocuments.length} documentos SEO con metaTitle`);

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const seoDoc of seoDocuments) {
      try {
        const slug = generateSlug(seoDoc.metaTitle);

        if (!slug) {
          console.warn(`⚠️  No se pudo generar slug para: ${seoDoc.metaTitle}`);
          skipCount++;
          continue;
        }

        // Determinar el modelo correcto según entityType
        let Model;
        let entityTypeName;

        switch (seoDoc.entityType) {
          case 'DrivingClass':
            Model = Classes;
            entityTypeName = 'Clase';
            break;
          case 'locations':
            Model = Location;
            entityTypeName = 'Location';
            break;
          case 'onlinecourses':
            Model = OnlineCourse;
            entityTypeName = 'Curso Online';
            break;
          default:
            console.warn(`⚠️  Tipo de entidad desconocido: ${seoDoc.entityType}`);
            skipCount++;
            continue;
        }

        // Verificar si el slug ya existe en otra entidad del mismo tipo
        const existingWithSlug = await Model.findOne({
          slug: slug,
          _id: { $ne: seoDoc.entityId }
        });

        if (existingWithSlug) {
          // Si existe, agregar un sufijo numérico
          const slugWithSuffix = `${slug}-${seoDoc.entityId.toString().slice(-4)}`;
          await Model.findByIdAndUpdate(seoDoc.entityId, { slug: slugWithSuffix });
          console.log(`✅ ${entityTypeName} actualizado: ${seoDoc.metaTitle} -> ${slugWithSuffix}`);
        } else {
          await Model.findByIdAndUpdate(seoDoc.entityId, { slug: slug });
          console.log(`✅ ${entityTypeName} actualizado: ${seoDoc.metaTitle} -> ${slug}`);
        }

        successCount++;
      } catch (error) {
        console.error(`❌ Error procesando ${seoDoc.metaTitle}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   ⏭️  Omitidos: ${skipCount}`);
    console.log(`   📝 Total procesados: ${seoDocuments.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar el script
generateSlugsFromSEO();
