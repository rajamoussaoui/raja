"""Add image column to users

Revision ID: 402264a49bbc
Revises: a32782ce1e75
Create Date: 2025-05-30 23:02:22.435384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '402264a49bbc'
down_revision: Union[str, None] = 'a32782ce1e75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     op.add_column('users', sa.Column('image', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'image')
