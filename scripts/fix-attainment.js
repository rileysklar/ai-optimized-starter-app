// Script to fix attainment data for all cells
// Run with: node scripts/fix-attainment.js

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

// Get connection string
const connectionString = process.env.DATABASE_URL;

console.log('Checking database connection...');
if (!connectionString) {
  console.error('Missing DATABASE_URL in .env.local file');
  process.exit(1);
}

// Create a postgres client with safer defaults
const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 30,
  ssl: { rejectUnauthorized: false }
});

async function fixAttainmentData() {
  try {
    console.log('Starting attainment data fix process...');
    
    // Get all cells
    const cells = await sql`SELECT id, name FROM cells`;
    
    console.log(`Found ${cells.length} cells to process`);
    
    // Process each cell
    for (const cell of cells) {
      console.log(`Processing cell: ${cell.name} (${cell.id})`);
      
      // Find metrics with null attainment
      const metricsToFix = await sql`
        SELECT id, date, parts_produced, actual_count, target_count
        FROM efficiency_metrics
        WHERE cell_id = ${cell.id}
        AND attainment_percentage IS NULL
      `;
      
      console.log(`Found ${metricsToFix.length} metrics with null attainment for cell ${cell.name}`);
      
      if (metricsToFix.length === 0) {
        continue;
      }
      
      // Process each metric
      let updatedCount = 0;
      
      for (const metric of metricsToFix) {
        // Calculate attainment percentage
        let actualCount = 0;
        let targetCount = 0;
        
        try {
          // Parse counts with fallbacks
          actualCount = metric.actual_count 
            ? parseInt(metric.actual_count) 
            : metric.parts_produced;
          
          targetCount = metric.target_count 
            ? parseInt(metric.target_count) 
            : actualCount; // Default to 100% attainment
          
          if (targetCount <= 0 || actualCount < 0) {
            console.warn(`Invalid counts for metric ${metric.id}: actual=${actualCount}, target=${targetCount}`);
            continue;
          }
          
          // Calculate attainment
          const attainmentValue = (actualCount / targetCount) * 100;
          
          // Validate and cap value
          if (isNaN(attainmentValue) || !isFinite(attainmentValue)) {
            console.warn(`Invalid attainment calculated for metric ${metric.id}: ${attainmentValue}`);
            continue;
          }
          
          const finalAttainment = Math.min(attainmentValue, 200); // Cap at 200%
          const attainmentString = String(Number(finalAttainment.toFixed(2)));
          
          // Update the metric
          await sql`
            UPDATE efficiency_metrics
            SET attainment_percentage = ${attainmentString},
                updated_at = ${new Date()}
            WHERE id = ${metric.id}
          `;
          
          updatedCount++;
          console.log(`Updated metric ${metric.id}: attainment=${attainmentString}%`);
        } catch (error) {
          console.error(`Error processing metric ${metric.id}: ${error.message}`);
        }
      }
      
      console.log(`Updated ${updatedCount} out of ${metricsToFix.length} metrics for cell ${cell.name}`);
    }
    
    console.log('Attainment data fix process completed!');
  } catch (error) {
    console.error('Error fixing attainment data:', error);
    throw error;
  } finally {
    // Close the database connection
    await sql.end();
    console.log('Database connection closed');
  }
}

// Run the fix
fixAttainmentData()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 