extends CharacterBody2D
class_name Player

@export var speed: float = 250.0

func _on_hit(dmg):
    print("Damage taken: ", dmg)
