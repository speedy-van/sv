import psycopg2
import sys

def main():
    try:
        print('🔄 Connecting to database...')
        conn = psycopg2.connect('postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
        cur = conn.cursor()

        print('✅ Connected successfully')

        # Add missing columns to DriverAvailability
        columns = [
            ('maxConcurrentDrops', 'INTEGER DEFAULT 5'),
            ('preferredServiceAreas', 'TEXT[]'),
            ('multiDropCapable', 'BOOLEAN DEFAULT true'),
            ('currentCapacityUsed', 'INTEGER DEFAULT 0'),
            ('experienceLevel', 'TEXT DEFAULT \'standard\''),
            ('routePreferences', 'JSONB DEFAULT \'{}\'')
        ]

        added = 0
        for col_name, col_def in columns:
            try:
                cur.execute(f'ALTER TABLE "DriverAvailability" ADD COLUMN IF NOT EXISTS "{col_name}" {col_def}')
                print(f'✅ Added {col_name}')
                added += 1
            except Exception as e:
                print(f'⚠️  {col_name}: {str(e)}')

        # Add Booking column
        try:
            cur.execute('ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "isMultiDrop" BOOLEAN DEFAULT false')
            print('✅ Added isMultiDrop to Booking')
            added += 1
        except Exception as e:
            print(f'⚠️  isMultiDrop: {str(e)}')

        conn.commit()
        print(f'🎉 Migration completed! Added {added} columns.')

    except Exception as e:
        print(f'❌ Error: {str(e)}')
        sys.exit(1)
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
        print('🔌 Database connection closed')

if __name__ == '__main__':
    main()

