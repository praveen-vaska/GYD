"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Plus,
  Power,
  Tag,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useGydStore } from "@/features/store/gyd-store";
import { Category } from "@/types";

export default function AdminCategoriesPage() {
  const { pushToast } = useToast();
  const {
    state,
    saveCategory,
    deleteCategory,
    toggleCategoryActive,
    moveCategoryOrder,
    addSubcategory,
  } = useGydStore();

  const sortedCategories = [...state.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [groupName, setGroupName] = useState("Fashion & Personal Styling");
  const [description, setDescription] = useState("");
  const [commissionRate, setCommissionRate] = useState("15");
  const [imageUrl, setImageUrl] = useState("/images/categories/wedding-styling.jpg");
  const [isPopular, setIsPopular] = useState(true);

  const [subTarget, setSubTarget] = useState<Category | null>(null);
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");

  const openCreate = () => {
    setEditingCat(null);
    setName("");
    setGroupName("Fashion & Personal Styling");
    setDescription("");
    setCommissionRate("15");
    setIsPopular(true);
    setCatModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setGroupName(cat.groupName);
    setDescription(cat.description);
    setCommissionRate(String(cat.commissionRate));
    setImageUrl(cat.imageUrl);
    setIsPopular(cat.isPopular);
    setCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || description.trim().length < 10) {
      pushToast({
        title: "Complete category fields",
        type: "warning",
      });
      return;
    }
    saveCategory({
      id: editingCat?.id,
      name,
      groupName,
      description,
      commissionRate: Number(commissionRate) || 15,
      imageUrl,
      isPopular,
      isActive: editingCat ? editingCat.isActive : true,
    });
    setCatModalOpen(false);
    pushToast({
      title: editingCat ? "Category updated" : "Category created",
      description: "Live immediately across the customer storefront.",
      type: "success",
    });
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTarget || subName.trim().length < 2) return;
    addSubcategory(subTarget.id, subName, subDesc || `${subName} specialty`);
    setSubTarget(null);
    setSubName("");
    setSubDesc("");
    pushToast({ title: "Subcategory added", type: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-semibold text-brand-text">
            Dynamic Category Management
          </h1>
          <p className="text-sm text-brand-text-secondary">
            Create, edit, disable, reorder, and set category-level commissions
            without code deployments.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      <div className="space-y-4">
        {sortedCategories.map((cat, idx) => (
          <article key={cat.id} className="gyd-card p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">Order #{cat.sortOrder}</Badge>
                  <Badge tone="primary">{cat.groupName}</Badge>
                  <Badge tone={cat.isActive ? "success" : "error"}>
                    {cat.isActive ? "Active" : "Disabled"}
                  </Badge>
                  <Badge tone="accent">Commission {cat.commissionRate}%</Badge>
                </div>
                <h2 className="font-editorial text-xl font-semibold text-brand-text">
                  {cat.name}
                </h2>
                <p className="text-xs text-brand-text-secondary max-w-2xl">
                  {cat.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Move category up"
                  disabled={idx === 0}
                  onClick={() => moveCategoryOrder(cat.id, "UP")}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Move category down"
                  disabled={idx === sortedCategories.length - 1}
                  onClick={() => moveCategoryOrder(cat.id, "DOWN")}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSubTarget(cat)}
                >
                  <Tag className="h-3.5 w-3.5" />
                  + Subcategory
                </Button>
                <Button
                  size="sm"
                  variant={cat.isActive ? "ghost" : "primary"}
                  onClick={() => toggleCategoryActive(cat.id)}
                >
                  <Power className="h-3.5 w-3.5" />
                  {cat.isActive ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-brand-error"
                  onClick={() => {
                    const res = deleteCategory(cat.id);
                    if (res.ok) {
                      pushToast({
                        title: `Category "${cat.name}" removed`,
                        type: "info",
                      });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-t border-brand-border pt-3">
              {cat.subcategories.map((sub) => (
                <Badge key={sub.id} tone="neutral">
                  {sub.name}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Category Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? `Edit ${editingCat.name}` : "Create Category"}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Discipline Group"
            />
            <Input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="Commission %"
            />
          </div>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image path"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this service category..."
          />
          <label className="flex items-center gap-2 text-sm font-medium text-brand-text cursor-pointer">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="accent-[var(--color-primary)]"
            />
            Feature in Popular Categories on Homepage
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCatModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        open={Boolean(subTarget)}
        onClose={() => setSubTarget(null)}
        title={`Add Subcategory to ${subTarget?.name ?? ""}`}
      >
        <form onSubmit={handleAddSub} className="space-y-4">
          <Input
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="Subcategory Name (e.g. Haldi Decor)"
          />
          <Input
            value={subDesc}
            onChange={(e) => setSubDesc(e.target.value)}
            placeholder="Short specialty description"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Subcategory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
