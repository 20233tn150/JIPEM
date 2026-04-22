from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('classrooms', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='matricula',
            field=models.CharField(db_index=True, max_length=20),
        ),
        migrations.AlterUniqueTogether(
            name='student',
            unique_together={('matricula', 'classroom')},
        ),
    ]
