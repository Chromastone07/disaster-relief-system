from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.disaster import Inventory
from models.notification import Notification
from models.auth import User


def _notify_admins_low_stock(db: Session, item_name: str, qty: int):
    """
    Queue low-stock notifications for all admins.
    Does NOT call db.commit() — the caller owns the transaction.
    """
    try:
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            db.add(Notification(
                user_id=admin.id,
                title="Low Stock Alert",
                message=f"Warning: '{item_name}' is critically low ({qty} units remaining)."
            ))
    except Exception:
        # Never let notification failures crash the main operation
        pass


def manage_inventory(
    action: str,
    db: Session,
    inventory_data: dict = None,
    inventory_id: int = None,
    quantity: int = None
):
    """
    Inventory Manager.
    action = "create" | "list" | "update" | "delete"
    """

    if action == "create":
        inv = Inventory(**inventory_data)
        db.add(inv)
        db.commit()
        db.refresh(inv)
        # Queue low-stock notifications if needed, then commit them together
        if inv.quantity < 10:
            _notify_admins_low_stock(db, inv.item, inv.quantity)
            try:
                db.commit()
            except Exception:
                db.rollback()
        return inv

    elif action == "list":
        return db.query(Inventory).order_by(Inventory.created_at.desc()).all()

    elif action == "update":
        inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if not inv:
            raise HTTPException(status_code=404, detail="Inventory item not found.")
        inv.quantity = quantity
        db.commit()
        db.refresh(inv)
        # Queue low-stock notifications if needed
        if quantity < 10:
            _notify_admins_low_stock(db, inv.item, quantity)
            try:
                db.commit()
            except Exception:
                db.rollback()
        return inv

    elif action == "delete":
        inv = db.query(Inventory).filter(Inventory.id == inventory_id).first()
        if not inv:
            raise HTTPException(status_code=404, detail="Inventory item not found.")
        db.delete(inv)
        db.commit()
        return {"message": "Inventory item deleted."}
