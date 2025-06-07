package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// AdminActionType represents specific admin actions
type AdminActionType string

const (
	// Documentation Management
	DocumentationModuleCreated    AdminActionType = "documentation_module_created"
	DocumentationModuleUpdated    AdminActionType = "documentation_module_updated"
	DocumentationModuleDeleted    AdminActionType = "documentation_module_deleted"
	DocumentationSubmoduleCreated AdminActionType = "documentation_submodule_created"
	DocumentationSubmoduleUpdated AdminActionType = "documentation_submodule_updated"
	DocumentationSubmoduleDeleted AdminActionType = "documentation_submodule_deleted"

	// User Access Management
	UserAccessRequestApproved  AdminActionType = "user_access_request_approved"
	UserAccessRequestDeclined  AdminActionType = "user_access_request_declined"
	UserMahasiswaStatusGranted AdminActionType = "user_mahasiswa_status_granted"
	UserMahasiswaStatusRevoked AdminActionType = "user_mahasiswa_status_revoked"

	// Quiz/Question Management
	QuestionCreated AdminActionType = "question_created"
	QuestionUpdated AdminActionType = "question_updated"
	QuestionDeleted AdminActionType = "question_deleted"
)

type AdminActivity struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	AdminID   primitive.ObjectID `json:"admin_id" bson:"admin_id"`
	Action    AdminActionType    `json:"action" bson:"action"`
	Timestamp time.Time          `json:"timestamp" bson:"timestamp"`

	// Resource References - only populate relevant fields based on action
	ModuleID     *primitive.ObjectID `json:"module_id,omitempty" bson:"module_id,omitempty"`
	SubmoduleID  *primitive.ObjectID `json:"submodule_id,omitempty" bson:"submodule_id,omitempty"`
	QuestionID   *primitive.ObjectID `json:"question_id,omitempty" bson:"question_id,omitempty"`
	TargetUserID *primitive.ObjectID `json:"target_user_id,omitempty" bson:"target_user_id,omitempty"`
}
